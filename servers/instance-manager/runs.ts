import { Router } from "express";
import { startInstance, stopInstance } from "./daemonClient";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { Redis } from "ioredis";
import { redis, REDIS_URL } from "../agents/storage/redis"
import { lazy } from "better-auth/*";

export const runsRouter = Router();

const redisSubscriber = new Redis(REDIS_URL, {lazyConnect: true})
re

/**
 * Write files to disk (for file-upload mode)
 */
function writeFilesToDisk(workspacePath: string, files: Record<string, string>) {
    if (!fs.existsSync(workspacePath)) {
        fs.mkdirSync(workspacePath, { recursive: true });
    }
    
    for (const [filePath, fileContent] of Object.entries(files)) {
        const fullPath = path.join(workspacePath, filePath);
        const dir = path.dirname(fullPath);
        
        // Create nested directories if needed
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        fs.writeFileSync(fullPath, fileContent, 'utf-8');
    }
}

/**
 * Main execution endpoint
 * Handles both file-upload  and git-based 
 */
runsRouter.post("/start", async (req, res) => {
    try {
        const { 
            execution_mode,  
            entry_point, 
            files, 
            language,
            // Git-specific fields
            git_url,
            commit_sha,
            branch
        } = req.body ?? {};

        const runId = randomUUID();
        const traceId = `trace_${runId}`;

        // Validation based on execution mode
        if (execution_mode === "git") {
            // Git mode validation
            if (!git_url || !commit_sha || !entry_point) {
                return res.status(400).json({
                    error: "Missing required fields for git mode: git_url, commit_sha, entry_point"
                });
            }
        } else {
            // File upload mode validation (default)
            if (!files || !entry_point) {
                return res.status(400).json({
                    error: "Missing required fields for file mode: files, entry_point"
                });
            }
        }

        // Setup workspace
        let workspacePath: string;
        let cacheHit = false;

        if (execution_mode === "git") {
            // Git mode: workspace will be managed by daemon's GitManager
            // Just pass the git info, daemon will handle cloning/caching
            workspacePath = `/cache/repos/${commit_sha.slice(0, 8)}`;
            
            // Note: In real implementation, daemon will return cache_hit status
            // For now, we'll check if the path exists (simplified)
            cacheHit = fs.existsSync(workspacePath);
            
        } else {
            // File upload mode: write files to temporary workspace
            workspacePath = `/tmp/kyntrix/${runId}`;
            writeFilesToDisk(workspacePath, files);
        }

        // Setup Redis subscription for completion notification
        const channel = `run:${runId}:complete`;
        
        const completionPromise = new Promise((resolve, reject) => {
            // Safety timeout
            const timeout = setTimeout(() => {
                redisSubscriber.unsubscribe(channel);
                reject(new Error("Execution timed out after 30s"));
            }, 30000);

            // Listen for completion from T2 Correlator
            redisSubscriber.subscribe(channel, (message) => {
                clearTimeout(timeout);
                redisSubscriber.unsubscribe(channel);
                
                try {
                    const result = JSON.parse(message);
                    resolve(result);
                } catch (err) {
                    reject(new Error("Failed to parse completion message"));
                }
            });
        });

        // Prepare payload for daemon
        const payload = {
            runId,
            traceId,
            template: (language || "python") as "node" | "python",
            entry: entry_point,
            
            // Mode-specific fields
            ...(execution_mode === "git" 
                ? {
                    mode: "git" as const,
                    gitUrl: git_url,
                    commitSha: commit_sha,
                    branch: branch,
                    workspacePath: workspacePath
                }
                : {
                    mode: "files" as const,
                    workspacePath: workspacePath,
                    files: files
                }
            )
        };

        // Start execution via daemon
        const daemonResponse = await startInstance(payload);
        
        if (!daemonResponse) {
            return res.status(500).json({
                error: "Failed to start instance in daemon"
            });
        }

        // Wait for execution to complete and get trace
        const executionResult = await completionPromise;

        // Build response in format CLI expects
        const response = {
            runId: runId,
            status: executionResult.status || "success",
            output: executionResult.output || "",
            error: executionResult.error,
            timeline: executionResult.timeline || [],
            trace_url: `http://localhost:3000/trace/${runId}`,
            cache_hit: cacheHit
        };

        return res.status(200).json(response);

    } catch (err) {
        console.error("[Instance Manager] Execution failed:", err);
        
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Internal server error"
        });
    }
});

/**
 * Stop a running execution
 */
runsRouter.post("/stop", async (req, res) => {
    try {
        const { runId } = req.body ?? {};
        
        if (!runId) {
            return res.status(400).json({
                error: "runId is required"
            });
        }

        const success = await stopInstance(runId);
        
        if (!success) {
            return res.status(500).json({
                error: "Failed to stop instance"
            });
        }

        return res.status(200).json({
            status: "stopped",
            runId: runId
        });
        
    } catch (err) {
        console.error("[Instance Manager] Stop failed:", err);
        
        return res.status(500).json({
            error: err instanceof Error ? err.message : "Failed to stop instance"
        });
    }
});





/**
 * Get trace for a specific run (for the `kyntrix trace` CLI command)
 */
runsRouter.get("/api/v1/trace/:runId", async (req, res) => {
    try {
        const { runId } = req.params;
        
        const traceKey = `trace:${runId}`;
        const traceData = await redis.get(traceKey);
        
        
        if (!traceData) {
            return res.status(404).json({
                error: "Trace not found",
                runId: runId
            });
        }

        const trace = JSON.parse(traceData);
        return res.status(200).json(trace);
        
    } catch (err) {
        console.error("[Instance Manager] Trace fetch failed:", err);
        
        return res.status(500).json({
            error: "Failed to fetch trace"
        });
    }
});

export default runsRouter;