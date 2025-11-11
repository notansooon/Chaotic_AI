import { z } from 'zod';
import { prisma } from '../../db/client.js';





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

type Tal = z.infer<typeof TalEvent>;



export const parseTal = async (ndjsonLine: string): Promise<Tal> => {
    const ev = TalEvent.parse(JSON.parse(ndjsonLine));


    await prisma.event.create({
        data: {
        run: { connect: { id: ev.runId } },
        seq: ev.seq,
        ts: BigInt(ev.ts as any),
        kind: ev.kind,
        span: ev.span ?? null,
        parentSpan: ev.parentSpan ?? null,
        nodeKey: ev.nodeKey ?? null,
        data: ev.data ?? {},
        code: ev.code ?? {},
        },
    });

    // Return TAL object to T2
    return ev;


}