/**
 * Authentication Router
 *
 * Handles:
 * - Better Auth endpoints (signup, signin, OAuth)
 * - API key management
 * - CLI device flow authentication
 */

import { Router } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '../auth/auth.js';
import { authenticate, rateLimit } from '../auth/middleware.js';
import {
    createApiKey,
    listApiKeys,
    revokeApiKey,
    type ApiKeyScope,
} from '../auth/api-keys.js';
import { prisma } from '../db/client.js';
import crypto from 'crypto';

export const authRouter = Router();

// ============================================================================
// BETTER AUTH HANDLER
// All /auth/* routes are handled by Better Auth
// ============================================================================

authRouter.all('/auth/*', toNodeHandler(auth));

// ============================================================================
// API KEY MANAGEMENT
// ============================================================================

/**
 * List user's API keys
 */
authRouter.get('/api-keys', authenticate(), async (req, res) => {
    try {
        const keys = await listApiKeys(req.user!.id);
        res.json({ keys });
    } catch (err) {
        console.error('[auth] Error listing API keys:', err);
        res.status(500).json({ error: 'Failed to list API keys' });
    }
});

/**
 * Create a new API key
 */
authRouter.post('/api-keys', authenticate(), async (req, res) => {
    const { name, scopes, expiresInDays } = req.body;

    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const result = await createApiKey(req.user!.id, name, {
            scopes: scopes as ApiKeyScope[],
            expiresInDays,
        });

        res.status(201).json({
            id: result.id,
            key: result.key, // Only shown once!
            message: 'Store this key securely. It will not be shown again.',
        });
    } catch (err) {
        console.error('[auth] Error creating API key:', err);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

/**
 * Revoke an API key
 */
authRouter.delete('/api-keys/:keyId', authenticate(), async (req, res) => {
    const { keyId } = req.params;

    try {
        const revoked = await revokeApiKey(keyId, req.user!.id);

        if (!revoked) {
            return res.status(404).json({ error: 'API key not found' });
        }

        res.json({ success: true, message: 'API key revoked' });
    } catch (err) {
        console.error('[auth] Error revoking API key:', err);
        res.status(500).json({ error: 'Failed to revoke API key' });
    }
});

// ============================================================================
// CLI DEVICE FLOW
// For authenticating CLI without exposing credentials
// ============================================================================

// Store pending device codes (in production, use Redis)
const deviceCodes = new Map<string, {
    userCode: string;
    userId?: string;
    expiresAt: number;
    interval: number;
}>();

/**
 * CLI requests a device code
 * Returns a code the user enters on the web
 */
authRouter.post('/device/code', rateLimit(), async (req, res) => {
    const deviceCode = crypto.randomBytes(32).toString('hex');
    const userCode = generateUserCode(); // Short, human-readable code

    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    deviceCodes.set(deviceCode, {
        userCode,
        expiresAt,
        interval: 5, // Poll every 5 seconds
    });

    res.json({
        device_code: deviceCode,
        user_code: userCode,
        verification_uri: `${process.env.APP_URL || 'http://localhost:3000'}/cli/verify`,
        verification_uri_complete: `${process.env.APP_URL || 'http://localhost:3000'}/cli/verify?code=${userCode}`,
        expires_in: 900, // 15 minutes
        interval: 5,
    });
});

/**
 * CLI polls for authorization status
 */
authRouter.post('/device/token', rateLimit(), async (req, res) => {
    const { device_code, grant_type } = req.body;

    if (grant_type !== 'urn:ietf:params:oauth:grant-type:device_code') {
        return res.status(400).json({ error: 'unsupported_grant_type' });
    }

    const pending = deviceCodes.get(device_code);

    if (!pending) {
        return res.status(400).json({ error: 'invalid_device_code' });
    }

    if (Date.now() > pending.expiresAt) {
        deviceCodes.delete(device_code);
        return res.status(400).json({ error: 'expired_token' });
    }

    if (!pending.userId) {
        return res.status(400).json({
            error: 'authorization_pending',
            message: 'User has not yet authorized this device',
        });
    }

    // User has authorized! Create an API key for the CLI
    const { key, id } = await createApiKey(pending.userId, 'CLI Login', {
        scopes: ['run:create', 'run:read', 'run:delete'],
    });

    // Clean up
    deviceCodes.delete(device_code);

    res.json({
        access_token: key,
        token_type: 'Bearer',
        scope: 'run:create run:read run:delete',
    });
});

/**
 * User authorizes a device code (called from web UI)
 */
authRouter.post('/device/authorize', authenticate(), async (req, res) => {
    const { user_code } = req.body;

    if (!user_code) {
        return res.status(400).json({ error: 'user_code is required' });
    }

    // Find the pending device code
    for (const [deviceCode, data] of deviceCodes.entries()) {
        if (data.userCode === user_code.toUpperCase()) {
            if (Date.now() > data.expiresAt) {
                deviceCodes.delete(deviceCode);
                return res.status(400).json({ error: 'Code has expired' });
            }

            // Mark as authorized
            data.userId = req.user!.id;

            return res.json({
                success: true,
                message: 'Device authorized. You can close this window.',
            });
        }
    }

    res.status(404).json({ error: 'Invalid code' });
});

// ============================================================================
// USER INFO
// ============================================================================

/**
 * Get current user info
 */
authRouter.get('/me', authenticate(), async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.id },
            select: {
                id: true,
                email: true,
                name: true,
                image: true,
                tier: true,
                createdAt: true,
                _count: {
                    select: {
                        runs: true,
                        apiKeys: true,
                    },
                },
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            ...user,
            authMethod: req.authMethod,
        });
    } catch (err) {
        console.error('[auth] Error fetching user:', err);
        res.status(500).json({ error: 'Failed to fetch user info' });
    }
});

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Generate a human-readable code like "ABCD-1234"
 */
function generateUserCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I, O to avoid confusion
    const nums = '23456789'; // No 0, 1 to avoid confusion

    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    code += '-';
    for (let i = 0; i < 4; i++) {
        code += nums[Math.floor(Math.random() * nums.length)];
    }

    return code;
}
