import dotenv from 'dotenv';
import { redis, ensureGroup } from '../storage/redis.js';
import { TalEventSchema, type TalEvent } from './t1_parser.js';
import { initState, applyEvent, buildDelta, GraphState } from './t2_correlator.js';

dotenv.config();

const STREAM_PREFIX = process.env.STREAM_PREFIX || 'tal';
const GROUP = process.env.GROUP || 'graph-worker';
const BATCH = Number(process.env.BATCH_COUNT) || 2000;
const BLOCK_MS = Number(process.env.BLOCK_MS) || 20;
const FPS = Number(process.env.FPS) || 5;
const EMIT_MS = Math.round(1000 / FPS);

function now(): number {
    return Date.now();
} 
const run = new Map<string, GraphState>();

async function scanStreams(): Promise<string[]> {
    const out: string[] = [];

    const stream = redis.scanStream({
        match: `${STREAM_PREFIX}:*`,
        count: 100,
    });

    return await new Promise<string[]>((resolve, reject) => {

        stream.on('data', (keys: string[]) => {
            for (const key of keys) {
                out.push(key);
            }
        });

        stream.on('end', () => {
            if (out.length === 0) {
                out.push(`${STREAM_PREFIX}:dummy`);
            }
            resolve(out);
        });

        stream.on('error', (err: any) => {
            reject(err);
        });

    });
}


async function main() {
    const streams = await scanStreams();
    for (const stream of streams) {
        await ensureGroup(stream);
    }


    let lastEmit = 0;

    while (true) {
        
        const args = [
            'GROUP', GROUP, `w-${process.pid}`,
            'BLOCK', String(BATCH),
            'COUNT', BATCH.toString(), 
            'STREAMS', ...streams, ...streams.map(() => '>')
        ];


        const resp = await (redis as any).xreadgroupBuffer(...args).catch((err: any) => null);
        if (!resp) {
            continue;
        }

        const acks: Array<[string, string[]]> = [];

        for (const [streamBuff, entries] of resp as any[]) {
            const stream = streamBuff.toString();
            const runId = stream.substring(stream.indexOf(':') + 1);

            let state = run.get(runId);

            if (!state) {
                state = initState();
                run.set(runId, state);
            }

            const ids: string[] = [];

            for (const [idBuff, kys] of entries) {
                const id = idBuff.toString();
                const json = kys[1].toString();
                
                try {
                    const event: TalEvent  = TalEventSchema.parse(JSON.parse(json));
                    applyEvent(state, event);
                    ids.push(id)
                }
                catch (err) {
                    console.error("Error parsing event:", err);
                }
            }

            if (ids.length > 0) {
                acks.push([stream, ids]);
            }
        }

        const nowTs = now();

        if (nowTs - lastEmit >= EMIT_MS) {


            for (const [runId, state] of run) {
                const delta = buildDelta(runId, state)
                await redis.publish(`updates:${runId}`, JSON.stringify({type: 'GraphDelta', ...delta}));

            }
            lastEmit = nowTs;

            for (const [stream, ids] of acks) {
                if (ids.length > 0) {
                    await redis.xack(stream, GROUP, ...ids);
                }
            }
        }

        

    }
               
}

main().catch((err) => {
    console.error("Fatal error in pipeline:", err);
    process.exit(1);
});
