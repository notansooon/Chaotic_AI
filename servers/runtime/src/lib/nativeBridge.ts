import { spawn } from "child_process";
import path from "path";

const CORE_PATH = path.resolve(process.cwd(), "build/runetime_core")

export function callCore(method: string, args: Record<string, any>) {
    return new Promise((resolve, reject) => {
        const proceess = spawn(CORE_PATH, [method, JSON.stringify(args)]);



        process.stdout.on("data", data => {
            
        })
    })
}