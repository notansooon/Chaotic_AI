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

function MessageDaemon(payload: Object): Promise<any> { // Change Any to something else later

    return new Promise((resolve, reject) => {
        

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
                    return resolve({ status: "ok" });
                }
                    const response = JSON.parse(responseBuffer);
                if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            } catch (e) {
                // Fallback for non-JSON ack
                resolve({ status: "ok", raw: responseBuffer });
            }

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