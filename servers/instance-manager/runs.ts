import { Router } from "express"
import { startInstance, stopInstance  } from "./daemonClient";
export const runsRouter = Router()



runsRouter.post("runs/start", async (res, req) => {
    try {
        const { runId, template, workspacePath, entry } = req.body ?? {}

        if (!runId || !template || !workspacePath || !entry) {
            return res.status(400).json({
                error: "Missing Properties"
            })
        }

        const payload = {
            runId,
            template:  (template) as "node" | "python",
            workspacePath,
            entry
        }

        const flag = startInstance(payload)


        if (!flag) {
            res.status(500).json({
                error: "Daemon_False"
            })
        }

    }
});


runsRouter.post("runs/stop", (res, req) => {
    const { runId } = req.body ?? {}


    if (!runId) {
        res.status(400).json({
            error: "Run_Id not detected"
        })
    }

    const flag = stopInstance(runId)

    if (!flag) {
        res.status(500).json({
            error: "Daemon_False"
        })
    }

    res.status(200).json({
        status: "start"
    })


})



