/**
 * Better Auth Configuration
 *
 * Sets up authentication with:
 * - Email/password login
 * - GitHub OAuth
 * - Google OAuth
 * - Session management
 */

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../db/client.js';

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),

    // Email & password authentication
    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false, // Set to true in production
    },

    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24,     // Update session every 24 hours
        cookieCache: {
            enabled: true,
            maxAge: 60 * 5, // 5 minutes
        },
    },

    // OAuth providers
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || '',
            clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
            enabled: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
        },
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        },
    },

    // User configuration
    user: {
        additionalFields: {
            tier: {
                type: 'string',
                defaultValue: 'free',
            },
            stripeCustomerId: {
                type: 'string',
                required: false,
            },
        },
    },

    // Advanced options
    advanced: {
        generateId: () => crypto.randomUUID(),
    },

    // Trusted origins for CORS
    trustedOrigins: [
        'http://localhost:3000',
        'http://localhost:4318',
        process.env.APP_URL || '',
    ].filter(Boolean),
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session['user'];
