import net from "net";
import dotenv from "dotenv";

dotenv.config();

const SocketPath = process.env.DAEMON_SOCKET_PATH;
if (!SocketPath) {
    throw new Error("DAEMON_SOCKET_PATH is not defined in environment variables.");
}

// Updated interface to support both file and git modes
export interface StartInstancePayload {
    runId: string;
    traceId: string;
    template: "node" | "python";
    entry: string;
    mode: "files" | "git";
    
    // File mode fields
    workspacePath?: string;
    files?: Record<string, string>;
    
    // Git mode fields
    gitUrl?: string;
    commitSha?: string;
    branch?: string;
}

interface DaemonResponse {
    status: "ok" | "error";
    error?: string;
    cache_hit?: boolean;  // For git mode
    raw?: string;
    [key: string]: any;
}

// Updated payload type to include new modes
type DaemonPayload = 
    | ({ action: "start" } & StartInstancePayload)
    | { action: "stop"; runId: string };

/**
 * Send a message to the C++ daemon via Unix socket
 */
function MessageDaemon(payload: DaemonPayload): Promise<DaemonResponse> { 
    return new Promise<DaemonResponse>((resolve, reject) => {
        const socket = net.createConnection({ path: SocketPath });
        
        // Set timeout to prevent hanging
        socket.setTimeout(35000); // 35 seconds (slightly more than execution timeout)
        
        socket.on("connect", () => {
            const json = JSON.stringify(payload);
            console.log(`[DaemonClient] Sending to daemon:`, json);
            socket.write(json);
            socket.end();
        });

        let responseBuffer = "";
        
        socket.on("data", (data) => {
            responseBuffer += data.toString();
        });

        socket.on("timeout", () => {
            socket.destroy();
            reject(new Error("Daemon communication timeout"));
        });

        socket.on("error", (error) => {
            console.error("[DaemonClient] Socket error:", error);
            reject(error);
        });

        socket.on("end", () => {
            try {
                if (!responseBuffer) {
                    // Empty response = success
                    return resolve({ status: "ok" } as DaemonResponse);
                }

                const response = JSON.parse(responseBuffer);
                console.log(`[DaemonClient] Received from daemon:`, response);
                
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response as DaemonResponse);
                }
            } catch (e) {
                // Fallback for non-JSON response
                console.warn("[DaemonClient] Non-JSON response:", responseBuffer);
                resolve({ status: "ok", raw: responseBuffer });
            }
        });
    });
}

/**
 * Start a new execution instance
 * Now supports both file and git modes
 */
export async function startInstance(req: StartInstancePayload): Promise<DaemonResponse> {
    try {
        // Validate based on mode
        if (req.mode === "git") {
            if (!req.gitUrl || !req.commitSha) {
                throw new Error("Git mode requires gitUrl and commitSha");
            }
        } else if (req.mode === "files") {
            if (!req.workspacePath) {
                throw new Error("File mode requires workspacePath");
            }
        }

        const response = await MessageDaemon({
            action: "start",
            runId: req.runId,
            traceId: req.traceId,
            template: req.template,
            entry: req.entry,
            mode: req.mode,
            
            // Include mode-specific fields
            ...(req.mode === "git" 
                ? {
                    gitUrl: req.gitUrl,
                    commitSha: req.commitSha,
                    branch: req.branch
                }
                : {
                    workspacePath: req.workspacePath,
                    files: req.files
                }
            )
        });

        return response;
        
    } catch (error) {
        console.error("[DaemonClient] Start instance failed:", error);
        throw error;
    }
}

/**
 * Stop a running execution instance
 */
export async function stopInstance(runId: string): Promise<DaemonResponse> {
    try {
        const response = await MessageDaemon({
            action: "stop",
            runId: runId,
        });

        return response;
        
    } catch (error) {
        console.error("[DaemonClient] Stop instance failed:", error);
        throw error;
    }
}

// Export types for use in other files
export type { DaemonResponse, DaemonPayload };