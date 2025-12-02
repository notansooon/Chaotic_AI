// adapters/node-embedded/src/autoHook.ts
import { configure } from "./sdk";
import { installExpressHook } from "./hooks/express";
import Module from "module";

configure(); // Init C++ agent_core before user code runs

const originalRequire = Module.prototype.require;

// Monkey-patch require() so when user requires "express", we hook it
Module.prototype.require = function (id: string) {
  const mod = originalRequire.apply(this, arguments as any);

  if (id === "express") {
    // Wrap express() factory
    return new Proxy(mod, {
      apply(target, thisArg, argArray) {
        const app = Reflect.apply(target as any, thisArg, argArray);
        installExpressHook(app);
        return app;
      },
    });
  }

  return mod;
};
