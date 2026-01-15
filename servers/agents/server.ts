import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import { ingestRouter } from './routers/ingest.js';
import { otlpRouter } from './routers/otlp.js';
import { runRouter } from './routers/run.js';
import { attachWebSocketServer } from './ws/hub.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));  // OTLP payloads can be large

// Route registrations
app.use("/ingest", ingestRouter);    // Legacy TAL ingest
app.use("/", otlpRouter);            // OTLP ingest at /v1/traces
app.use("/api", runRouter);          // Run management

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "agents" });
});

const server = http.createServer(app);
attachWebSocketServer(server);

const PORT = Number(process.env.HTTP_PORT) || Number(process.env.WS_PORT) || 4318;

server.listen(PORT, () => {
    console.log(`Agent server listening on port ${PORT}`);
    console.log(`  - OTLP endpoint: http://localhost:${PORT}/v1/traces`);
    console.log(`  - TAL endpoint:  http://localhost:${PORT}/ingest/tal`);
    console.log(`  - WebSocket:     ws://localhost:${PORT}`);
});