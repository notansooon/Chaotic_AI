
const native = require("../../build/Release/kyntrix_agent.node");

export function initAgentCore() {
    native.init({
        ingestUrl: process.env.KYNTRIX_INGEST_URL,
        runId: process.env.KYNTRIX_RUN_ID,
        batchSize: Number(),
        flushInterval: Number()

    });
}


export type RecordArgs = {
  runId?: string | null;
  seq?: number;          
  ts?: number;           
  kind: string;
  span?: string | null;
  parentSpan?: string | null;
  nodeKey?: string | null;
  dataJson?: string | null;  
};

export function recordEvent(ev: {
  kind: string;
  runId?: string;
  seq?: number;
  ts?: number;
  span?: string;
  parentSpan?: string;
  nodeKey?: string;
  data?: any;
}) {
  const payload: RecordArgs = {
    runId: ev.runId ?? null,
    seq: ev.seq ?? -1,
    ts: ev.ts ?? 0,
    kind: ev.kind,
    span: ev.span ?? null,
    parentSpan: ev.parentSpan ?? null,
    nodeKey: ev.nodeKey ?? null,
    dataJson: ev.data ? JSON.stringify(ev.data) : null,
  };

  native.record(payload);
}

