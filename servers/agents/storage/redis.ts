import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const STREAM_PREFIX = process.env.STREAM_PREFIX || 'tal';
export const GROUP = process.env.GROUP || 'graph-worker';

// Create Redis client with error handling and retry logic
export const redis = new Redis(REDIS_URL, {
    lazyConnect: true,
    retryStrategy: (times) => {
        if (times > 10) {
            console.error('[redis] Connection failed after 10 retries');
            return null;
        }
        const delay = Math.min(times * 200, 3000);
        console.log(`[redis] Retrying connection in ${delay}ms (attempt ${times})`);
        return delay;
    },
    maxRetriesPerRequest: 3
});

redis.on('error', (err) => {
    console.error('[redis] Connection error:', err.message);
});

redis.on('connect', () => {
    console.log('[redis] Connected to', REDIS_URL);
});

redis.on('ready', () => {
    console.log('[redis] Ready to accept commands');
});

// Connect immediately
redis.connect().catch((err) => {
    console.error('[redis] Initial connection failed:', err.message);
});

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

