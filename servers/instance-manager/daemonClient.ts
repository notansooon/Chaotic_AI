import net from "net";
import dotenv from "dotenv";
dotenv.config();



const SocketPath = process.env.DAEMON_SOCKET_PATH;
if (!SocketPath) {
    throw new Error("DAEMON_SOCKET_PATH is not defined in environment variables.");
}

export interface StartInstance {
    runId: string;
    template: "node" | "python";
    workspacePath: string;
    entry: string;
    
}

interface DaemonResponse {
    status: "ok" | "error";
    error?: string;
    raw?: string;
    [key: string]: any;
}

type DaemonPayload = 
    | ({ action: "start" } & StartInstance)
    | { action: "stop"; runId: string };


function MessageDaemon(payload: DaemonPayload): Promise<DaemonResponse> { 

    return new Promise<DaemonResponse>((resolve, reject) => {
        

        const socket = net.createConnection({ path: SocketPath });
        

        socket.on("connect", () => {
            const json = JSON.stringify(payload)
            socket.write(json)
            socket.end()
        })

        let responseBuffer = "";

        socket.on("data", (data) => {
            responseBuffer += data.toString();
        });


        socket.on("error", (error) => {
            reject(error)
        })

        socket.on("end", () => {

            try {
        
                if (!responseBuffer) {
                    return resolve({ status: "ok" } as DaemonResponse);
                }
                    const response = JSON.parse(responseBuffer);
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response as DaemonResponse);
                }
            } catch (e) {
                // Fallback for non-JSON ack
                resolve({ status: "ok", raw: responseBuffer });
            }

        })


   })
}


export function startInstance(req: StartInstance): Promise<DaemonResponse> {
    return MessageDaemon({
        action: "start",
        runId: req.runId,
        template: req.template,
        workspacePath: req.workspacePath,
        entry: req.entry
    })
}

export function stopInstance(runId: string): Promise<DaemonResponse> {
    return MessageDaemon({
        action: "stop",
        runId: runId,
        
    }) 
}