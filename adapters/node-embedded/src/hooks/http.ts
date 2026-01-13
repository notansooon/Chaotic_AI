import * as http from "http";
import * as https from "https"
import { nativeRecord, NativeEvent } from "../native";

let httpSeq = 0;

function nowMs(): number {
    return Date.now();
}

export function initializeHttpHooks() {
    const originalHttpRequest = http.request;
    (http as any).request = function (...args: any[]) {
        const req = originalHttpRequest.apply(this, args as any);
        const seq = httpSeq++;

        nativeRecord({
            seq,
            ts: nowMs(),
            kind: "http_request_start",
            dataJson: JSON.stringify({
                method: req.method,
                host: req.getHeader('host'),
                path: req.path,
            })
        });

        req.on("response", (res: any) => {
            nativeRecord({
                seq: httpSeq++,
                ts: nowMs(),
                kind: "http_response",
                dataJson: JSON.stringify({
                    statusCode: res.statusCode,
                    headers: res.headers,
                })
            });
        });

        req.on("error", (err: Error) => {
            nativeRecord({
                seq: httpSeq++,
                ts: nowMs(),
                kind: "http_error",
                dataJson: JSON.stringify({
                    message: err.message,
                })
            });
        });

        return req;
    }
}