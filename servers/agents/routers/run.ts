import { Router } from "express";
import { prisma } from "../db/client.js";

export const runRouter = Router();

runRouter.get("/health", (req, res) => {
    res.json({ ok: true });
}) 
 
runRouter.post("/dev/run", async (req, res) => {
    const run = await prisma.run.create({
        data:{}
    })
    res.json({  id: run.id, status: run.status, createdAt: run.createdAt})
})

runRouter.get("/run", async (req, res) => {
    const runs = await prisma.run.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 20,
    });
    res.json(runs);
})

