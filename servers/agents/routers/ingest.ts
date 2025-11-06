import { Router } from 'express';
import { z } from 'zod';
import split2 from 'split2';
import { prisma } from '../db/client.js';

const ingestRouter = Router();

const TalEvent = z.object({
    runId: z.string(),
    seq: z.number().int(),
    ts: z.number().or(z.bigint()),
    kind: z.string(),
    span: z.string().optional(),
    parentSpan: z.string().optional(),
    nodeKey: z.string().optional(),
    data: z.any().optional(),
    code: z.any().optional(),

})


ingestRouter.post("/ingest/tal", (req, res) => {
    req.setEncoding('utf8');
    const stream = req.pipe(split2());
    stream.on('data', async (line: string) => {
        
        const event = TalEvent.parse(JSON.parse(line));
        await prisma.event.create({
            data: {
                run: { connect: { id: event.runId } },  

                seq: event.seq,
                ts: BigInt(event.ts),
                kind: event.kind,

                // optionals 
                span: event.span ?? null,
                parentSpan: event.parentSpan ?? null,
                nodeKey: event.nodeKey ?? null,
                data: event.data ?? {},
                code: event.code ?? {}
            },
        });
        
    });
})
   