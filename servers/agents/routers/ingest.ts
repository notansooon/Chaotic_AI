import { Router } from 'express';
import { z } from 'zod';
import split2 from 'split2';

import { processLine } from '../src/pipeline/index.js';

export const ingestRouter = Router();




ingestRouter.post("/ingest/tal", (req, res) => {
    req.setEncoding('utf8');

    const stream = req.pipe(split2());

    const socket = (req as any).socket;

    stream.on('data', async (line: string) => {
        
        try {
            const { runId, sessionId } = JSON.parse(line)
            await processLine(line, socket);
        }
        catch (err) {
            console.error("Error processing line:", err);
        }
    });


    stream.on('end', () => {
        res.status(200).json({ ok: true });;
    })
})
   
