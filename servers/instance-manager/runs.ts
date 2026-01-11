import { Router } from "express";
import { startInstance, stopInstance } from "./daemonClient";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";


// Assuming you have a redis client set up in a separate file
// You need a DEDICATED connection for subscriptions (Redis requirement)


import { createClient } from "redis";

export const runsRouter = Router()

function writeFilesToDisk(workspacePath: string, files: Record<string, string>) {

    if (!fs.existsSync(workspacePath)) {
        fs.mkdirSync(workspacePath, { recursive: true });
    }
    for (const [file_name, file_content] of Object.entries(files)) {

    }
}

runsRouter.post("/start", async (req, res) => {
    try {
        const { entry_point, files, language } = req.body ?? {}
        const runId = randomUUID()


        if (!files || !entry_point) {
            return res.status(400).json({
                error: "Missing Properties"
            })
        }

        const workspacePath = `/tmp/kyntrix/${runId}`;
        writeFilesToDisk(workspacePath, files)
        

        const channel = '`run:${runId}:complete`;'

        const completionPromise = new Promise((resolve, reject) => {
            // Safety Timeout: Don't hang forever if the Daemon crashes
            const timeout = setTimeout(() => {
                redisSubscriber.unsubscribe(channel);
                reject(new Error("Execution timed out"));
            }, 30000); // 30 seconds

            // Listen for the "Done" message from T2 Correlator
            redisSubscriber.subscribe(channel, (message) => {
                clearTimeout(timeout);
                redisSubscriber.unsubscribe(channel); // Clean up listener
                resolve(JSON.parse(message));
            });
        });


        


        const payload = {
            runId,
            template: (language || "python") as "node" | "python",
            workspacePath,
            entry:  entry_point,
            
        }

        const flag = await startInstance(payload)


        if (!flag) {
            return res.status(500).json({
                error: "Daemon_False"
            })
        }

        const graph = await completionPromise;


        return res.status(200).json(graph)

    }
    catch (err) {
        return res.status(500).json({
            error: "Daemon_False"
        })

    }
});


runsRouter.post("/stop", (req, res) => {
    const { runId } = req.body ?? {}


    if (!runId) {
        return res.status(400).json({
            error: "Run_Id not detected"
        })
    }

    const flag = stopInstance(runId)

    if (!flag) {
        return res.status(500).json({
            error: "Daemon_False"
        })
    }

    return res.status(200).json({
        status: "start"
    })


})



