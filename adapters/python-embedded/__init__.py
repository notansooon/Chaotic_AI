# adapters/python-embedded/kyntrix_agent/__init__.py

import os
import itertools
import time
from .binding import init_agent as _init_agent, record_event as _record_event, flush, shutdown
from .decorators import trace_function

__all__ = ["configure", "trace_function", "flush", "shutdown"]

_seq_counter = itertools.count(1)

def now_ms() -> int:
    return int(time.time() * 1000)

def configure() -> None:
    """
    Initialize the C++ agent core using environment variables.

    KYNTRIX_INGEST_URL  (default: http://localhost:8081/ingest/tal)
    KYNTRIX_RUN_ID      (default: python-demo-run)
    KYNTRIX_BATCH_SIZE  (default: 100)
    KYNTRIX_FLUSH_MS    (default: 1000)
    """
    ingest_url = os.getenv("KYNTRIX_INGEST_URL", "http://localhost:8081/ingest/tal")
    run_id     = os.getenv("KYNTRIX_RUN_ID", "python-demo-run")
    batch_size = int(os.getenv("KYNTRIX_BATCH_SIZE", "100"))
    flush_ms   = int(os.getenv("KYNTRIX_FLUSH_MS", "1000"))

    _init_agent(ingest_url, run_id, batch_size, flush_ms)

def next_seq() -> int:
    return next(_seq_counter)

def record(kind: str,
           span: str | None = None,
           parent_span: str | None = None,
           node_key: str | None = None,
           data_json: str | None = None,
           run_id: str | None = None) -> None:
    """
    High-level record function used by decorators.
    """
    _record_event(
        run_id=run_id,
        seq=next_seq(),
        ts=now_ms(),
        kind=kind,
        span=span,
        parent_span=parent_span,
        node_key=node_key,
        data_json=data_json,
    )

