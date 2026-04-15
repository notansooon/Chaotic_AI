import { Router } from "express";

export const reflectionRouter = Router();

reflectionRouter.post("/reflection", (_req, res) => {
    res.status(200).json({ ok: true });
});