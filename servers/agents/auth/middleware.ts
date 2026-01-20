/**
 * Authentication Middleware
 *
 * Supports two auth methods:
 * 1. Session-based (cookies) - for web UI
 * 2. API key (Authorization header) - for CLI
 */

import type { Request, Response, NextFunction } from 'express';
import { auth } from './auth.js';
import { validateApiKey, hasScope, type ApiKeyScope } from './api-keys.js';

// Extend Express Request to include auth info
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string;
                tier: string;
            };
            apiKey?: {
                id: string;
                scopes: string[];
                rateLimit: number;
            };
            authMethod?: 'session' | 'apikey';
        }
    }
}

/**
 * Extract API key from Authorization header
 * Supports: "Bearer kyx_live_xxx" or just "kyx_live_xxx"
 */
function extractApiKey(authHeader: string | undefined): string | null {
    if (!authHeader) return null;

    if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
    }

    if (authHeader.startsWith('kyx_')) {
        return authHeader;
    }

    return null;
}

/**
 * Authentication middleware
 * Checks for API key first, then falls back to session
 */
export function authenticate(
    options: {
        required?: boolean;
        scopes?: ApiKeyScope[];
    } = {}
) {
    const { required = true, scopes = [] } = options;

    return async (req: Request, res: Response, next: NextFunction) => {
        // Try API key auth first
        const apiKey = extractApiKey(req.headers.authorization);

        if (apiKey) {
            const result = await validateApiKey(apiKey);

            if (result.valid && result.user && result.apiKey) {
                // Check required scopes
                for (const scope of scopes) {
                    if (!hasScope(result.apiKey.scopes, scope)) {
                        return res.status(403).json({
                            error: 'Forbidden',
                            message: `Missing required scope: ${scope}`,
                        });
                    }
                }

                req.user = result.user;
                req.apiKey = result.apiKey;
                req.authMethod = 'apikey';
                return next();
            }

            if (required) {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: result.error || 'Invalid API key',
                });
            }
        }

        // Try session auth
        try {
            const session = await auth.api.getSession({
                headers: req.headers as any,
            });

            if (session?.user) {
                req.user = {
                    id: session.user.id,
                    email: session.user.email,
                    tier: (session.user as any).tier || 'free',
                };
                req.authMethod = 'session';
                return next();
            }
        } catch (err) {
            // Session auth failed, continue
        }

        // No valid auth found
        if (required) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required. Provide an API key or valid session.',
            });
        }

        next();
    };
}

/**
 * Require specific scopes (use after authenticate)
 */
export function requireScopes(...scopes: ApiKeyScope[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Session auth has all permissions
        if (req.authMethod === 'session') {
            return next();
        }

        // Check API key scopes
        if (req.apiKey) {
            for (const scope of scopes) {
                if (!hasScope(req.apiKey.scopes, scope)) {
                    return res.status(403).json({
                        error: 'Forbidden',
                        message: `Missing required scope: ${scope}`,
                    });
                }
            }
        }

        next();
    };
}

/**
 * Require specific tier (use after authenticate)
 */
export function requireTier(...tiers: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Authentication required',
            });
        }

        if (!tiers.includes(req.user.tier)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `This feature requires one of these tiers: ${tiers.join(', ')}`,
                currentTier: req.user.tier,
            });
        }

        next();
    };
}

/**
 * Simple rate limiting based on API key limits
 * For production, use a proper rate limiter with Redis
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit() {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.apiKey) {
            return next(); // No rate limit for session auth
        }

        const key = req.apiKey.id;
        const limit = req.apiKey.rateLimit;
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute window

        let entry = rateLimitStore.get(key);

        if (!entry || entry.resetAt < now) {
            entry = { count: 0, resetAt: now + windowMs };
            rateLimitStore.set(key, entry);
        }

        entry.count++;

        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

        if (entry.count > limit) {
            return res.status(429).json({
                error: 'Too Many Requests',
                message: `Rate limit exceeded. Limit: ${limit} requests per minute.`,
                retryAfter: Math.ceil((entry.resetAt - now) / 1000),
            });
        }

        next();
    };
}
