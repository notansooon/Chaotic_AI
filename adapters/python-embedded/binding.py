# adapters/python-embedded/kyntrix_agent/binding.py

import os
import sys
import ctypes
from ctypes import c_char_p, c_longlong, c_int, Structure, POINTER

# ---------- 1. Locate and load the shared library ----------

def _default_lib_name() -> str:
    if sys.platform == "win32":
        return "kyntrix_agent.dll"
    elif sys.platform == "darwin":
        return "libkyntrix_agent.dylib"
    else:
        return "libkyntrix_agent.so"

LIB_PATH = os.getenv("KYNTRIX_AGENT_LIB", _default_lib_name())
_lib = ctypes.CDLL(LIB_PATH)

# ---------- 2. Mirror the C structs in Python ----------

class KyntrixAgentConfig(Structure):
    _fields_ = [
        ("ingest_url", c_char_p),
        ("run_id",     c_char_p),
        ("batch_size", c_int),
        ("flush_interval_ms", c_int),
    ]

class KyntrixEvent(Structure):
    _fields_ = [
        ("run_id",      c_char_p),
        ("seq",         c_longlong),
        ("ts",          c_longlong),
        ("kind",        c_char_p),
        ("span",        c_char_p),
        ("parent_span", c_char_p),
        ("node_key",    c_char_p),
        ("data_json",   c_char_p),
    ]

# ---------- 3. Declare function signatures ----------

_lib.kyntrix_agent_init.argtypes    = [POINTER(KyntrixAgentConfig)]
_lib.kyntrix_agent_init.restype     = None

_lib.kyntrix_agent_record.argtypes  = [POINTER(KyntrixEvent)]
_lib.kyntrix_agent_record.restype   = None

_lib.kyntrix_agent_flush.argtypes   = []
_lib.kyntrix_agent_flush.restype    = None

_lib.kyntrix_agent_shutdown.argtypes = []
_lib.kyntrix_agent_shutdown.restype  = None

# ---------- 4. Python helpers wrapping the C functions ----------

_initialized = False

def init_agent(ingest_url: str, run_id: str,
               batch_size: int = 100,
               flush_interval_ms: int = 1000) -> None:
    global _initialized
    if _initialized:
        return

    cfg = KyntrixAgentConfig(
        ingest_url=ingest_url.encode("utf-8"),
        run_id=run_id.encode("utf-8"),
        batch_size=batch_size,
        flush_interval_ms=flush_interval_ms,
    )
    _lib.kyntrix_agent_init(ctypes.byref(cfg))
    _initialized = True

def record_event(run_id: str | None,
                 seq: int,
                 ts: int,
                 kind: str,
                 span: str | None = None,
                 parent_span: str | None = None,
                 node_key: str | None = None,
                 data_json: str | None = None) -> None:
    if run_id is not None:
        run_id_b = run_id.encode("utf-8")
    else:
        run_id_b = None

    def enc(s: str | None):
        return s.encode("utf-8") if s is not None else None

    ev = KyntrixEvent(
        run_id      = run_id_b,
        seq         = c_longlong(seq),
        ts          = c_longlong(ts),
        kind        = enc(kind),
        span        = enc(span),
        parent_span = enc(parent_span),
        node_key    = enc(node_key),
        data_json   = enc(data_json),
    )
    _lib.kyntrix_agent_record(ctypes.byref(ev))

def flush() -> None:
    _lib.kyntrix_agent_flush()

def shutdown() -> None:
    _lib.kyntrix_agent_shutdown()

