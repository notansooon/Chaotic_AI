import dotenv from 'dotenv';
import http from 'http';
import url from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import { Redis } from 'ioredis'
import { channel } from 'diagnostics_channel';
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const WS_PORT = Number(process.env.WS_PORT) || 8080;


const sub = new Redis(REDIS_URL, { lazyConnect: false });

type Client = {
    ws: WebSocket;
    runId: string;
}

const clients = new Set<Client>();

const server = http.createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
    const { query } = url.parse(req.url || '', true);
    const runId = query.runId as string;

    if (!runId) {
        ws.close(1008, 'runId query parameter is required');
        return;
    }
    const client = { ws, runId };
    clients.add(client);
    
    ws.on('close', () => {
        clients.delete(client);

    })


    sub.psubscribe('update:*').then(() => {
        console.log(`[ws-hub] Subscribed to updates:*`);

    })

    sub.on('pmessage', (_pattern, channel, message) => {
        const runId = channel.split(':')[1];

        for (const client of clients) {
            if (client.runId === runId && client.ws.readyState === WebSocket.OPEN ) {
                client.ws.send(message);

            }
        }
    })

})


server.listen(WS_PORT, () => {
    console.log(`[ws-hub] WebSocket server listening on port ${WS_PORT}`);
})





