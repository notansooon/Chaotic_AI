/**
 * API Key Management
 *
 * Handles API key generation, validation, and management for CLI authentication.
 * Keys follow format: kyx_live_<random> or kyx_test_<random>
 */

import crypto from 'crypto';
import { prisma } from '../db/client.js';

const KEY_PREFIX_LIVE = 'kyx_live_';
const KEY_PREFIX_TEST = 'kyx_test_';
const KEY_LENGTH = 32; // 32 random bytes = 64 hex chars

export type ApiKeyScope =
    | 'run:create'
    | 'run:read'
    | 'run:delete'
    | 'user:read'
    | 'user:write'
    | 'apikey:manage';

export const DEFAULT_SCOPES: ApiKeyScope[] = ['run:create', 'run:read', 'run:delete'];

export const TIER_RATE_LIMITS: Record<string, number> = {
    free: 60,        // 60 requests/min
    pro: 300,        // 300 requests/min
    enterprise: 1000 // 1000 requests/min
};

/**
 * Generate a new API key
 * Returns the full key (only shown once) and the data to store
 */
export function generateApiKey(isTest: boolean = false): {
    fullKey: string;
    prefix: string;
    hash: string;
} {
    const prefix = isTest ? KEY_PREFIX_TEST : KEY_PREFIX_LIVE;
    const randomPart = crypto.randomBytes(KEY_LENGTH).toString('hex');
    const fullKey = `${prefix}${randomPart}`;
    const hash = hashApiKey(fullKey);

    return {
        fullKey,
        prefix,
        hash,
    };
}

/**
 * Hash an API key for storage
 */
export function hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
    userId: string,
    name: string,
    options: {
        scopes?: ApiKeyScope[];
        expiresInDays?: number;
        isTest?: boolean;
    } = {}
): Promise<{ key: string; id: string }> {
    const { scopes = DEFAULT_SCOPES, expiresInDays, isTest = false } = options;

    // Get user tier for rate limiting
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tier: true },
    });

    const rateLimit = TIER_RATE_LIMITS[user?.tier || 'free'];
    const { fullKey, prefix, hash } = generateApiKey(isTest);

    const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

    const apiKey = await prisma.apiKey.create({
        data: {
            userId,
            name,
            keyPrefix: prefix,
            keyHash: hash,
            scopes,
            rateLimit,
            expiresAt,
        },
    });

    return {
        key: fullKey,  // Only returned once!
        id: apiKey.id,
    };
}

/**
 * Validate an API key and return the associated user
 */
export async function validateApiKey(key: string): Promise<{
    valid: boolean;
    userId?: string;
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
    error?: string;
}> {
    // Check format
    if (!key.startsWith(KEY_PREFIX_LIVE) && !key.startsWith(KEY_PREFIX_TEST)) {
        return { valid: false, error: 'Invalid key format' };
    }

    const hash = hashApiKey(key);

    const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash: hash },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    tier: true,
                },
            },
        },
    });

    if (!apiKey) {
        return { valid: false, error: 'Invalid API key' };
    }

    // Check if revoked
    if (apiKey.revokedAt) {
        return { valid: false, error: 'API key has been revoked' };
    }

    // Check if expired
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { valid: false, error: 'API key has expired' };
    }

    // Update usage stats (fire and forget)
    prisma.apiKey.update({
        where: { id: apiKey.id },
        data: {
            lastUsedAt: new Date(),
            usageCount: { increment: 1 },
        },
    }).catch(() => {}); // Ignore errors

    return {
        valid: true,
        userId: apiKey.userId,
        user: apiKey.user,
        apiKey: {
            id: apiKey.id,
            scopes: apiKey.scopes,
            rateLimit: apiKey.rateLimit,
        },
    };
}

/**
 * List API keys for a user (without exposing the actual keys)
 */
export async function listApiKeys(userId: string) {
    return prisma.apiKey.findMany({
        where: {
            userId,
            revokedAt: null,
        },
        select: {
            id: true,
            name: true,
            keyPrefix: true,
            scopes: true,
            rateLimit: true,
            lastUsedAt: true,
            usageCount: true,
            createdAt: true,
            expiresAt: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(keyId: string, userId: string): Promise<boolean> {
    const result = await prisma.apiKey.updateMany({
        where: {
            id: keyId,
            userId, // Ensure user owns the key
            revokedAt: null,
        },
        data: {
            revokedAt: new Date(),
        },
    });

    return result.count > 0;
}

/**
 * Check if an API key has a specific scope
 */
export function hasScope(scopes: string[], required: ApiKeyScope): boolean {
    return scopes.includes(required);
}
