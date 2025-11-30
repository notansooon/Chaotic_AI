// adapters/node-embedded/src/hooks/express.ts

import { recordEvent } from "../native.js"; // Sends event → agent_core C++
import type { Request, Response, NextFunction } from "express";

let installed = false;

/**
 * Hooks into Express route and middleware pipeline.
 * This gives high-level PROGRAM EXECUTION telemetry.
 */
export function installExpressHook(express: any) {
    if (installed) return;
    installed = true;

    const Router = express.Router;

    // ------------ Hook MIDDLEWARE ------------
    const origUse = Router.use;
    Router.use = function (path: any, fn: any) {
        if (typeof path === "function") {
            fn = path;
            path = "/";
        }

        const wrapped = function (req: Request, res: Response, next: NextFunction) {
            const start = Date.now();

            recordEvent({
                kind: "express.middleware.start",
                node_key: `MIDDLEWARE ${path}`,
                span: path,
                parent_span: req.url,
                data_json: "{}",
            });

            fn(req, res, function () {
                recordEvent({
                    kind: "express.middleware.end",
                    node_key: `MIDDLEWARE ${path}`,
                    span: path,
                    parent_span: req.url,
                    data_json: JSON.stringify({ duration: Date.now() - start }),
                });

                next();
            });
        };

        return origUse.call(this, path, wrapped);
    };


    // ------------ Hook ROUTES ------------
    const METHODS = ["get", "post", "put", "delete", "patch"];
    for (const method of METHODS) {
        const orig = Router[method];

        Router[method] = function (path: string, handler: any) {
            const wrapped = function (req: Request, res: Response, next: NextFunction) {
                const start = Date.now();

                recordEvent({
                    kind: "express.route.start",
                    node_key: `${method.toUpperCase()} ${path}`,
                    span: path,
                    parent_span: req.url,
                    data_json: JSON.stringify({
                        params: req.params,
                        query: req.query,
                    }),
                });

                handler(req, res, function () {
                    recordEvent({
                        kind: "express.route.end",
                        node_key: `${method.toUpperCase()} ${path}`,
                        span: path,
                        parent_span: req.url,
                        data_json: JSON.stringify({
                            status: res.statusCode,
                            duration: Date.now() - start,
                        }),
                    });

                    next();
                });
            };

            return orig.call(this, path, wrapped);
        };
    }

    console.log("[Kyntrix] Express hook installed.");
}

