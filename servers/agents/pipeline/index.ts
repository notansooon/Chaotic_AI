import dotenv from 'dotenv';
import { redis, ensureGroup } from '../storage/redis.js';
import { TalEventSchema, type TalEvent } from './t1_parser.js';
import { initState, applyEvent, buildDelta, GraphState } from './t2_correlator.js';
import {
    initPersistenceState,
    persistGraph,
    saveSnapshot,
    PersistenceState,
} from './persistence.js';

dotenv.config();

const STREAM_PREFIX = process.env.STREAM_PREFIX || 'tal';
const GROUP = process.env.GROUP || 'graph-worker';
const BATCH = Number(process.env.BATCH_COUNT) || 2000;
const BLOCK_MS = Number(process.env.BLOCK_MS) || 20;
const FPS = Number(process.env.FPS) || 5;
const EMIT_MS = Math.round(1000 / FPS);

// Persistence settings
const PERSIST_ENABLED = process.env.PERSIST_ENABLED !== 'false';
const PERSIST_INTERVAL_MS = Number(process.env.PERSIST_INTERVAL_MS) || 5000; // Persist every 5 seconds
const SNAPSHOT_INTERVAL_MS = Number(process.env.SNAPSHOT_INTERVAL_MS) || 60000; // Snapshot every minute

function now(): number {
    return Date.now();
}

type RunState = {
    graph: GraphState;
    persistence: PersistenceState;
    lastPersist: number;
    lastSnapshot: number;
};

const runs = new Map<string, RunState>();

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

    console.log(`[pipeline] Starting with STREAM_PREFIX=${STREAM_PREFIX}, PERSIST_ENABLED=${PERSIST_ENABLED}`);

    while (true) {

        const args = [
            'GROUP', GROUP, `w-${process.pid}`,
            'BLOCK', String(BLOCK_MS),
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

            let runState = runs.get(runId);

            if (!runState) {
                runState = {
                    graph: initState(),
                    persistence: initPersistenceState(),
                    lastPersist: now(),
                    lastSnapshot: now(),
                };
                runs.set(runId, runState);
                console.log(`[pipeline] New run detected: ${runId}`);
            }

            const ids: string[] = [];

            for (const [idBuff, kys] of entries) {
                const id = idBuff.toString();
                const json = kys[1].toString();

                try {
                    const event: TalEvent = TalEventSchema.parse(JSON.parse(json));
                    applyEvent(runState.graph, event);
                    ids.push(id)
                }
                catch (err) {
                    console.error("[pipeline] Error parsing event:", err);
                }
            }

            if (ids.length > 0) {
                acks.push([stream, ids]);
            }
        }

        const nowTs = now();

        // Emit GraphDeltas at configured FPS
        if (nowTs - lastEmit >= EMIT_MS) {

            for (const [runId, runState] of runs) {
                const delta = buildDelta(runId, runState.graph);

                // Publish to WebSocket clients
                await redis.publish(`updates:${runId}`, JSON.stringify({ type: 'GraphDelta', ...delta }));

                // Persist to database periodically
                if (PERSIST_ENABLED && nowTs - runState.lastPersist >= PERSIST_INTERVAL_MS) {
                    try {
                        const result = await persistGraph(runId, runState.graph, runState.persistence);
                        if (result.nodesCreated > 0 || result.edgesCreated > 0) {
                            console.log(`[pipeline] Persisted run=${runId}: ${result.nodesCreated} nodes, ${result.edgesCreated} edges, ${result.nodesUpdated} updated`);
                        }
                        runState.lastPersist = nowTs;
                    } catch (err) {
                        console.error(`[pipeline] Persistence error for run=${runId}:`, err);
                    }
                }

                // Save periodic snapshots
                if (PERSIST_ENABLED && nowTs - runState.lastSnapshot >= SNAPSHOT_INTERVAL_MS) {
                    try {
                        await saveSnapshot(runId, runState.graph);
                        console.log(`[pipeline] Snapshot saved for run=${runId}`);
                        runState.lastSnapshot = nowTs;
                    } catch (err) {
                        console.error(`[pipeline] Snapshot error for run=${runId}:`, err);
                    }
                }
            }
            lastEmit = nowTs;

            // ACK processed messages
            for (const [stream, ids] of acks) {
                if (ids.length > 0) {
                    await redis.xack(stream, GROUP, ...ids);
                }
            }
        }
    }
}

main().catch((err) => {
    console.error("[pipeline] Fatal error:", err);
    process.exit(1);
});
