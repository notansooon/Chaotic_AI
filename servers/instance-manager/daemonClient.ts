import net from "net";
import dotenv from "dotenv";
import { json } from "stream/consumers";
dotenv.config();



const SocketPath = process.env.DAEMON_SOCKET_PATH;

export interface StartInstance {
    runId: string;
    template: "node" | "python";
    workspacePath: string;
    entry: string;
    
}

function MessageDaemon(payload: Object): Promise<boolean> {

    return new Promise((resolve, reject) => {
        

        const socket = net.createConnection({ path: SocketPath });

        socket.on("connect", () => {
            const json = JSON.stringify(payload)
            socket.write(json)
        })

        socket.on("data", (buf) => {

            try {
                const res = JSON.parse(buff);
                resolve(true)
            }
            catch (err) {
                reject(err);
            }
            finally {
                socket.end();
            }

        })

        socket.on("error", (error) => {
            reject(error)
        })


   })
}


export function startInstance(req: StartInstance): Promise<boolean> {
    return MessageDaemon({
        action: "start",
        runId: req.runId,
        template: req.template,
        workspacePath: req.workspacePath,
        entry: req.entry
    })
}

export function stopInstance(runId: string):Promise<boolean> {
    return MessageDaemon({
        action: "stop",
        runId: runId,
        
    }) 
}