import { Router } from 'express';
import { z } from 'zod';
import split2 from 'split2';

import { redis, streamKey } from '../storage/redis.js';
import { processLine } from '../src/pipeline/index.js';

export const ingestRouter = Router();


const TalEvent = z.object({
    runId: z.string(),
    seq: z.number().int().nonnegative(),
    ts: z.number().or(z.bigint()),
    kind: z.string(),
    span: z.string().optional(),
    parentSpan: z.string().optional(),
    nodeKey: z.string().optional(),
    data: z.any().optional(),
    code: z.any().optional(),

})



ingestRouter.post("/ingest/tal", (req, res) => {
    const pipeline = redis.pipeline();
    req.setEncoding('utf8');
    let amount = 0;

    const stream = req.pipe(split2());
     
    const socket = (req as any).socket;

    stream.on('data', async (line: string) => {
        
        try {
            const parsed = TalEvent.parse(JSON.parse(line));
            const key = `run:${parsed.runId}`;
            pipeline.xadd(key, '*', 'json', JSON.stringify(parsed));
            amount += 1;

            if (amount % 512 == 0) {
                void pipeline.exec();

            } 
            
        }
        catch (err) {
            console.error("Error processing line:", err);
        }
    });


    stream.on('end', async () => {
        if (amount % 512 != 0) {
            await pipeline.exec();
            res.status(200).json({ status: 'ok', ingested: amount });

        }
    })
})
   
