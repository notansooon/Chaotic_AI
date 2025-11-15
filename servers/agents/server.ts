import express from 'express';
import dotenv from 'dotenv';
import { ingestRouter } from './routers/ingest.js';
import { runRouter } from './routers/run.js';
import http from 'http';
dotenv.config();


const app = express();
app.use(express.json());



app.use((req, _res, next) => {
    (req as any).socket = socket;
    next();
})


const server = http.createServer(app);



app.use(ingestRouter);
app.use(runRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Agent server listening on port ${PORT}`);
});
