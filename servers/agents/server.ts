import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { ingestRouter } from './routers/ingest.js';
import { otlpRouter } from './routers/otlp.js';
import { runRouter } from './routers/run.js';
import { authRouter } from './routers/auth.js';
import { attachWebSocketServer } from './ws/hub.js';

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:4318',
        process.env.APP_URL || '',
    ].filter(Boolean),
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));  

// Route registrations
app.use("/", authRouter);                
app.use("/ingest", ingestRouter);       
app.use("/", otlpRouter);                
app.use("/api", runRouter);              

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "agents" });
});

const server = http.createServer(app);
attachWebSocketServer(server);

const PORT = Number(process.env.HTTP_PORT) || Number(process.env.WS_PORT) || 4318;

server.listen(PORT, () => {
    console.log(`Agent server listening on port ${PORT}`);
    console.log(`  - Auth endpoint:  http://localhost:${PORT}/auth/*`);
    console.log(`  - OTLP endpoint:  http://localhost:${PORT}/v1/traces`);
    console.log(`  - TAL endpoint:   http://localhost:${PORT}/ingest/tal`);
    console.log(`  - API endpoint:   http://localhost:${PORT}/api/*`);
    console.log(`  - WebSocket:      ws://localhost:${PORT}`);
});
