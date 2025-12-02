import os
import itertools
import time
import json
from .binding import init_agent as _init_agent, record_event as _record_event, flush as _flush, shutdown as _shutdown

__all__ = ["configure", "record", "flush", "shutdown"]

_seq_counter = itertools.count(1)
_initialized = False

def now_ms() -> int:
    return int(time.time() * 1000)

def configure() -> None:
    """
    Initialize C++ agent_core using environment variables.

    KYNTRIX_INGEST_URL  (default: http://localhost:8081/ingest/tal)
    KYNTRIX_RUN_ID      (default: python-demo-run)
    KYNTRIX_BATCH_SIZE  (default: 100)
    KYNTRIX_FLUSH_MS    (default: 1000)
    """
    global _initialized
    if _initialized:
        return

    ingest_url = os.getenv("KYNTRIX_INGEST_URL", "http://localhost:8081/ingest/tal")
    run_id     = os.getenv("KYNTRIX_RUN_ID", "python-demo-run")
    batch_size = int(os.getenv("KYNTRIX_BATCH_SIZE", "100"))
    flush_ms   = int(os.getenv("KYNTRIX_FLUSH_MS", "1000"))

    _init_agent(ingest_url, run_id, batch_size, flush_ms)
    _initialized = True

def _next_seq() -> int:
    return next(_seq_counter)

def record(
    kind: str,
    span: str | None = None,
    parent_span: str | None = None,
    node_key: str | None = None,
    data: dict | None = None,
    run_id: str | None = None,
) -> None:
    if not _initialized:
        # You can raise if you want strict behavior:
        # raise RuntimeError("Kyntrix agent not configured. Call configure() first.")
        return

    data_json = json.dumps(data) if data is not None else None

    _record_event(
        run_id=run_id,
        seq=_next_seq(),
        ts=now_ms(),
        kind=kind,
        span=span,
        parent_span=parent_span,
        node_key=node_key,
        data_json=data_json,
    )

def flush() -> None:
    if not _initialized:
        return
    _flush()

def shutdown() -> None:
    if not _initialized:
        return
    _shutdown()
