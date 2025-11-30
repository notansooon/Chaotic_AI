import * as http from "http";
import * as https from "https"
import { recordEvent } from "../native";

export function initalizeHttpHooks() {
    const originalHttpRequest = http.request;
    (http as any).request = function (...args: any[]) {

        const req = originalHttpRequest.apply(this, args as any);

        recordEvent({
            kind: "http_request",
            data: {
                method: req.method,
                host: req.getHeader('host'),
            }
        });

        req.on("response", (res: any) => {

            recordEvent({
                kind: "http_request",
                data: {
                    statusCode: res.statusCode 
                }
            })
            
        });


        return req

    }
}