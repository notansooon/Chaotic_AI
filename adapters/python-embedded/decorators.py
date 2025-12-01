from . import record  # <-- high level function from __init__.py
import json
from functools import wraps

def trace_function(span=None, node_key=None):
    def decorator(fn):
        s = span or fn.__name__
        nk = node_key or fn.__qualname__

        @wraps(fn)
        def wrapped(*args, **kwargs):
            # before calling the real function
            record(
                kind="py.func.start",
                span=s,
                node_key=nk,
                data_json=json.dumps({"args": repr(args), "kwargs": repr(kwargs)}),
            )

            try:
                result = fn(*args, **kwargs)
                # after success
                record(
                    kind="py.func.end",
                    span=s,
                    node_key=nk,
                    data_json=json.dumps({"result": repr(result)}),
                )
                return result
            except Exception as e:
                # on error
                record(
                    kind="py.func.error",
                    span=s,
                    node_key=nk,
                    data_json=json.dumps({"error": repr(e)}),
                )
                raise

        return wrapped
    return decorator

