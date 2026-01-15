import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { ingestRouter } from './routers/ingest.js';
import { otlpRouter } from './routers/otlp.js';
import { runRouter } from './routers/run.js';
import { attachWebSocketServer } from './ws/hub.js';
import { requireAuth } from './middleware/auth.js';

dotenv.config();

const app = express();

// CORS for CLI/browser access
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));  // OTLP payloads can be large

// Health check (no auth)
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "agents" });
});

// Route registrations
// OTLP ingest - requires auth for external requests
app.use("/v1", requireAuth, otlpRouter);

// Legacy TAL ingest - requires auth
app.use("/ingest", requireAuth, ingestRouter);

// Run management API - requires auth
app.use("/api", requireAuth, runRouter);

const server = http.createServer(app);
attachWebSocketServer(server);

const PORT = Number(process.env.HTTP_PORT) || Number(process.env.WS_PORT) || 4318;

server.listen(PORT, () => {
    console.log(`Agent server listening on port ${PORT}`);
    console.log(`  - OTLP endpoint: http://localhost:${PORT}/v1/traces`);
    console.log(`  - TAL endpoint:  http://localhost:${PORT}/ingest/tal`);
    console.log(`  - WebSocket:     ws://localhost:${PORT}`);
});