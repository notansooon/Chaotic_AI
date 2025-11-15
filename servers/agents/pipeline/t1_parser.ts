import { z } from 'zod';

export const TalEventSchema = z.object({
    runId: z.string().min(1),
    seq: z.number().int().nonnegative(),
    ts: z.number().or(z.bigint()),
    kind: z.string(),
    span: z.string().optional(),
    parentSpan: z.string().optional(),
    nodeKey: z.string().optional(),
    data: z.any().optional(),
    code: z.any().optional(),

})

export type TalEvent = z.infer<typeof TalEventSchema>;


