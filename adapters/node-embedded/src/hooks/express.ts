// adapters/node-embedded/src/hooks/express.ts
import type { Request, Response, NextFunction } from "express";
import { record } from "../sdk";

// Patch an Express app to record middleware + handlers.
export function installExpressHook(app: any) {
  const originalUse = app.use;

  app.use = function (...args: any[]) {
    const last = args[args.length - 1];

    if (typeof last === "function") {
      const wrapped = function (req: Request, res: Response, next: NextFunction) {
        const span = `${req.method} ${req.path}`;
        const start = Date.now();

        record("http.middleware.start", {
          span,
          nodeKey: "express.middleware",
          data: { path: req.path },
        });

        function wrappedNext(err?: any) {
          const duration = Date.now() - start;
          record("http.middleware.end", {
            span,
            nodeKey: "express.middleware",
            data: {
              path: req.path,
              durationMs: duration,
              error: err ? String(err) : undefined,
            },
          });
          return next(err);
        }

        return last(req, res, wrappedNext);
      };

      const newArgs = [...args.slice(0, -1), wrapped];
      return originalUse.apply(this, newArgs);
    }

    return originalUse.apply(this, args);
  };

  // You can later patch app.get/post/etc similarly if needed
}
