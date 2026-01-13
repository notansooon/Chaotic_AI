import { Router } from 'express';
import { z } from 'zod';
import split2 from 'split2';

import { redis, streamKey } from '../storage/redis.js';


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

/*
ingestRouter.post('/tal', (req, res) => {
  console.log('[ingest] HIT /tal');


  req.setEncoding('utf8');
  const stream = req.pipe(split2());
  let amount = 0;

  stream.on('data', (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    amount += 1;
    console.log('[ingest] line:', trimmed);
  });

  stream.on('end', () => {
    console.log('[ingest] END, amount =', amount);
    res.status(200).json({ status: 'ok', ingested: amount });
  });

  stream.on('error', (err) => {
    console.error('[ingest] stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'ingest failed' });
    }
  });
});
*/

ingestRouter.post("/tal", (req, res) => {
    const pipeline = redis.pipeline();
    req.setEncoding('utf8');
    let amount = 0;

    const stream = req.pipe(split2());

    stream.on('data', async (line: string) => {
        
        try {

            const trimmed = line.trim()
            if (!trimmed) {
                return
            }

            console.log ("Stream data: ", line)

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
        // Flush any remaining events in the pipeline
        if (amount % 512 != 0) {
            await pipeline.exec();
        }
        // Always send response
        res.status(200).json({ status: 'ok', ingested: amount });
    });

    stream.on('error', (err) => {
        console.error('[ingest] stream error:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'ingest failed' });
        }
    });
})
