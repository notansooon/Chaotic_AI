import dotenv from 'dotenv';
import http from 'http';
import url from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import { Redis } from 'ioredis';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

type Client = {
    ws: WebSocket;
    runId: string;
}

const clients = new Set<Client>();
let sub: Redis | null = null;

function initRedisSubscriber(): Redis {
    const redis = new Redis(REDIS_URL, {
        lazyConnect: true,
        retryStrategy: (times) => {
            if (times > 5) {
                console.error('[ws-hub] Redis connection failed after 5 retries');
                return null;
            }
            return Math.min(times * 200, 2000);
        }
    });

    redis.on('error', (err) => {
        console.error('[ws-hub] Redis error:', err.message);
    });

    redis.on('connect', () => {
        console.log('[ws-hub] Redis connected');
    });

    return redis;
}

export const attachWebSocketServer = (server: http.Server) => {
    const wss = new WebSocketServer({ server, path: undefined });

    // Initialize Redis subscriber with error handling
    sub = initRedisSubscriber();

    sub.connect().then(() => {
        return sub!.psubscribe('updates:*');
    }).then(() => {
        console.log('[ws-hub] Subscribed to updates:*');
    }).catch((err) => {
        console.error('[ws-hub] Failed to subscribe:', err.message);
    });

    sub.on('pmessage', (_pattern, channel, message) => {
        const runIdFromChannel = channel.split(':')[1];

        for (const client of clients) {
            if (
                client.runId === runIdFromChannel &&
                client.ws.readyState === WebSocket.OPEN
            ) {
                client.ws.send(message);
            }
        }
    });

    wss.on('connection', (ws, req) => {
        const parsedUrl = url.parse(req.url || '', true);
        const runId = parsedUrl.query.runId as string;

        // Log connection attempt
        console.log(`[ws-hub] Connection attempt: path=${parsedUrl.pathname}, runId=${runId}`);

        if (!runId) {
            ws.close(1008, 'runId query parameter is required');
            return;
        }

        const client = { ws, runId };
        clients.add(client);
        console.log(`[ws-hub] Client connected for run: ${runId}`);

        ws.on('close', () => {
            clients.delete(client);
            console.log(`[ws-hub] Client disconnected for run: ${runId}`);
        });

        ws.on('error', (err) => {
            console.error(`[ws-hub] WebSocket error for run ${runId}:`, err.message);
        });
    });
};




