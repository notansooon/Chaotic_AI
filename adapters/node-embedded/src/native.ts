const native = require("../build/Release/kyntrix_agent.node") as {
  init(config: {
    ingestUrl: string;
    runId: string;
    batchSize: number;
    flushIntervalMs: number;
  }): void;

  record(ev: {
    runId?: string | null;
    seq: number;
    ts: number;
    kind: string;
    span?: string | null;
    parentSpan?: string | null;
    nodeKey?: string | null;
    dataJson?: string | null;
  }): void;

  flush(): void;
  shutdown(): void;
};

export type NativeAgentConfig = {
  ingestUrl: string;
  runId: string;
  batchSize: number;
  flushIntervalMs: number;
};

export type NativeEvent = {
  runId?: string | null;
  seq: number;
  ts: number;
  kind: string;
  span?: string | null;
  parentSpan?: string | null;
  nodeKey?: string | null;
  dataJson?: string | null;
};

// Called once per process to configure C++ agent_core
export function nativeInit(cfg: NativeAgentConfig) {
  native.init({
    ingestUrl: cfg.ingestUrl,
    runId: cfg.runId,
    batchSize: cfg.batchSize,
    flushIntervalMs: cfg.flushIntervalMs,
  });
}

// Called for every telemetry event
export function nativeRecord(ev: NativeEvent) {
  native.record(ev);
}

export function nativeFlush() {
  native.flush();
}

export function nativeShutdown() {
  native.shutdown();
}

