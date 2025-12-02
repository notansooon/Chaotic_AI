# adapters/python-embedded/kyntrix_agent/autohook.py
import runpy
import sys
from . import configure, record, flush, shutdown

def run_script(path: str) -> None:
    configure()

    record("py.script.start", span="__main__", node_key=path, data={"argv": sys.argv[1:]})

    try:
        runpy.run_path(path, run_name="__main__")
        record("py.script.end", span="__main__", node_key=path, data={"status": "ok"})
    except SystemExit as e:
        record("py.script.end", span="__main__", node_key=path, data={"status": "exit", "code": e.code})
        raise
    except Exception as e:
        record("py.script.error", span="__main__", node_key=path, data={"error": repr(e)})
        raise
    finally:
        flush()
        shutdown()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python -m kyntrix_agent.autohook <script.py>")
        sys.exit(1)

    script_path = sys.argv[1]
    sys.argv = sys.argv[1:]  # make user script see its own args
    run_script(script_path)
