import dotenv from 'dotenv';
import Redis from 'ioredis';
import { lazy } from 'zod';



dotenv.config();

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const STREAM_PREFIX = process.env.STREAM_PREFIX || 'tal';
export const GROUP = process.env.GROUP || 'graph-worker';


export const redis = new Redis(REDIS_URL, { lazyConnect: false });

export function streamKey(sessionId: string) {
    return `${STREAM_PREFIX}:${sessionId}`;
}

export async function ensureGroup(stream: string) {
    try {
        await redis.xgroup('CREATE', stream, GROUP, '$', 'MKSTREAM');
    }
    catch (err) {
        
        const msg = (err as Error).message;
        if (!msg.includes('BUSYGROUP')) {
            throw err;
        }
    }
}

