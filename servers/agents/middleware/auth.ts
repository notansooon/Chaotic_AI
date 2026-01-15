/**
 * API Key Authentication Middleware
 *
 * Validates requests using API key in Authorization header.
 * Format: Authorization: Bearer <api_key>
 */

import { Request, Response, NextFunction } from 'express';

const API_KEY = process.env.API_KEY || process.env.KYNTRIX_API_KEY;

export interface AuthenticatedRequest extends Request {
    apiKey?: string;
    userId?: string;
}

/**
 * Middleware to require API key authentication
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip auth in development if no API_KEY is set
    if (!API_KEY) {
        console.warn('[auth] No API_KEY configured, skipping authentication');
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing Authorization header'
        });
    }

    // Support both "Bearer <key>" and just "<key>"
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : authHeader;

    if (token !== API_KEY) {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Invalid API key'
        });
    }

    req.apiKey = token;
    next();
}

/**
 * Optional auth - doesn't fail if no key provided
 * Useful for endpoints that work differently when authenticated
 */
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (authHeader && API_KEY) {
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : authHeader;

        if (token === API_KEY) {
            req.apiKey = token;
        }
    }

    next();
}

/**
 * Extract run ID from request and validate ownership
 * (For future: validate that the API key owns this run)
 */
export function validateRunAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const runId = req.params.runId || req.query.runId;

    if (!runId) {
        return res.status(400).json({
            error: 'Bad Request',
            message: 'Missing runId parameter'
        });
    }

    // TODO: Check that this API key has access to this run
    // For MVP, we just pass through

    next();
}
