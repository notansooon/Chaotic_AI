import { Router } from "express"
import { startInstance, stopInstance  } from "./daemonClient";
import { randomUUID } from "crypto";



export const runsRouter = Router()

function writeFilesToDisk(workspacePath, files) {

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

        


        const payload = {
            runId,
            template: (language || "python") as "node" | "python",
            workspacePath,
            entry:  entry_point,
            
        }

        const flag = startInstance(payload)


        if (!flag) {
            return res.status(500).json({
                error: "Daemon_False"
            })
        }

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



