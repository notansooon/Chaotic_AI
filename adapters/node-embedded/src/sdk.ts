// adapters/node-embedded/src/sdk.ts
import { nativeInit, nativeRecord, nativeFlush, nativeShutdown, NativeEvent } from "./native";

let initialized = false;
let seqCounter = 1;

function nowMs(): number {
  return Date.now();
}

function nextSeq(): number {
  return seqCounter++;
}

export function configure() {
  if (initialized) return;

  const ingestUrl = process.env.KYNTRIX_INGEST_URL ?? "http://localhost:8081/ingest/tal";
  const runId     = process.env.KYNTRIX_RUN_ID ?? "node-demo-run";
  const batchSize = process.env.KYNTRIX_BATCH_SIZE ? parseInt(process.env.KYNTRIX_BATCH_SIZE, 10) : 100;
  const flushMs   = process.env.KYNTRIX_FLUSH_INTERVAL ? parseInt(process.env.KYNTRIX_FLUSH_INTERVAL, 10) : 1000;

  nativeInit({
    ingestUrl,
    runId,
    batchSize,
    flushIntervalMs: flushMs,
  });

  initialized = true;
}

// What instrumentation calls to emit events
export function record(
  kind: string,
  opts?: {
    span?: string;
    parentSpan?: string;
    nodeKey?: string;
    data?: unknown;
    runId?: string;
  }
) {
  if (!initialized) {
    // You can throw instead if you want it loud:
    // throw new Error("Kyntrix Node agent not configured. configure() must be called first.");
    return;
  }

  const ev: NativeEvent = {
    runId: opts?.runId ?? null,
    seq: nextSeq(),
    ts: nowMs(),
    kind,
    span: opts?.span ?? null,
    parentSpan: opts?.parentSpan ?? null,
    nodeKey: opts?.nodeKey ?? null,
    dataJson: opts?.data ? JSON.stringify(opts.data) : null,
  };

  nativeRecord(ev);
}

export function flush() {
  if (!initialized) return;
  nativeFlush();
}

export function shutdown() {
  if (!initialized) return;
  nativeShutdown();
}

