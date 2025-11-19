import express from 'express';
import dotenv from 'dotenv';
import { ingestRouter } from './routers/ingest';
import { attachWebSocketServer } from './ws/hub';
import http from 'http';
dotenv.config();


const app = express();
app.use(express.json());
app.use("/ingest", ingestRouter);


const server = http.createServer(app);
attachWebSocketServer(server);

server.listen(process.env.WS_PORT || 8081, () => {
    console.log(`Agent server listening on port ${process.env.WS_PORT || 8081}`);
});