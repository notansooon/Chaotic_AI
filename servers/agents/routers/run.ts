import { Router } from "express";
import { prisma } from "../db/client.js";
import { exportForLLM, type ExportFormat } from "../pipeline/llm_export.js";
import type { GraphDelta, Node, Edge } from "../pipeline/t2_correlator.js";
import { authenticate, requireScopes, rateLimit } from "../auth/middleware.js";

export const runRouter = Router();

runRouter.get("/health", (req, res) => {
    res.json({ ok: true });
})

/**
 * Create a new run (requires authentication)
 */
runRouter.post("/run", authenticate(), rateLimit(), requireScopes('run:create'), async (req, res) => {
    const { label } = req.body;

    const run = await prisma.run.create({
        data: {
            label,
            userId: req.user!.id,
        }
    })
    res.status(201).json({ id: run.id, status: run.status, createdAt: run.createdAt })
})

/**
 * List runs (requires authentication, shows only user's runs)
 */
runRouter.get("/run", authenticate(), rateLimit(), requireScopes('run:read'), async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;

    const runs = await prisma.run.findMany({
        where: {
            userId: req.user!.id,
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: Math.min(Number(limit), 100),
        skip: Number(offset),
    });
    res.json(runs);
})

/**
 * Delete a run (requires authentication)
 */
runRouter.delete("/run/:runId", authenticate(), rateLimit(), requireScopes('run:delete'), async (req, res) => {
    const { runId } = req.params;

    // Verify ownership
    const run = await prisma.run.findFirst({
        where: {
            id: runId,
            userId: req.user!.id,
        },
    });

    if (!run) {
        return res.status(404).json({ error: 'Run not found' });
    }

    // Delete related data first (cascade)
    await prisma.$transaction([
        prisma.event.deleteMany({ where: { runId } }),
        prisma.edge.deleteMany({ where: { runId } }),
        prisma.node.deleteMany({ where: { runId } }),
        prisma.snapshot.deleteMany({ where: { runId } }),
        prisma.cursor.deleteMany({ where: { runId } }),
        prisma.run.delete({ where: { id: runId } }),
    ]);

    res.json({ success: true, message: 'Run deleted' });
})

/**
 * Get graph data for a specific run
 * Returns the full graph with nodes and edges
 */
runRouter.get("/run/:runId/graph", authenticate(), rateLimit(), requireScopes('run:read'), async (req, res) => {
    const { runId } = req.params;

    try {
        // Verify ownership
        const run = await prisma.run.findFirst({
            where: {
                id: runId,
                userId: req.user!.id,
            },
        });

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        // Fetch nodes and edges from database
        const [nodes, edges] = await Promise.all([
            prisma.node.findMany({
                where: { runId },
                orderBy: { num: 'asc' },
            }),
            prisma.edge.findMany({
                where: { runId },
                orderBy: { createdSeq: 'asc' },
            }),
        ]);

        // Transform to GraphDelta format
        const graphNodes: Node[] = nodes.map(n => {
            const props = n.props as any || {};
            return {
                id: n.id,
                num: n.num,
                label: n.label || n.key || 'unknown',
                type: n.type as any,
                kind: props.kind || 'call',
                span: n.span,
                parentSpan: null,
                key: n.key,
                startedAt: Number(n.startedAt),
                endedAt: n.endedAt ? Number(n.endedAt) : null,
                duration: props.duration || null,
                startedSeq: n.startedSeq,
                endedSeq: n.endedSeq,
                status: props.status || 'completed',
                data: props.data || {},
                props: {
                    errorCount: props.errorCount || 0,
                    childCount: props.childCount || 0,
                },
            };
        });

        const graphEdges: Edge[] = edges.map(e => {
            const props = e.props as any || {};
            return {
                from: e.fromNodeId,
                to: e.toNodeId,
                ordinal: e.ordinal,
                createdSeq: e.createdSeq,
                kind: e.kind || 'calls',
                createdAt: props.createdAt || 0,
            };
        });

        // Build counter from nodes
        const counter: Record<string, number> = {};
        for (const node of graphNodes) {
            counter[node.kind] = (counter[node.kind] || 0) + 1;
        }

        // Build summary
        const nodesByType: Record<string, number> = {};
        let errorCount = 0;
        let completedCount = 0;
        let runningCount = 0;

        for (const node of graphNodes) {
            nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
            if (node.status === 'error') errorCount++;
            else if (node.status === 'completed') completedCount++;
            else runningCount++;
        }

        const delta: GraphDelta = {
            runId,
            atSeq: nodes.length > 0 ? Math.max(...nodes.map(n => n.endedSeq || n.startedSeq)) : 0,
            timestamp: Date.now(),
            nodes: graphNodes,
            edges: graphEdges,
            counter,
            summary: {
                totalNodes: graphNodes.length,
                totalEdges: graphEdges.length,
                errorCount,
                completedCount,
                runningCount,
                nodesByType,
            },
        };

        res.json(delta);
    } catch (err) {
        console.error('[run] Error fetching graph:', err);
        res.status(500).json({ error: 'Failed to fetch graph' });
    }
})

/**
 * Get graph data formatted for LLM consumption
 * Supports multiple export formats: json, prompt, jsonld
 */
runRouter.get("/run/:runId/llm", authenticate(), rateLimit(), requireScopes('run:read'), async (req, res) => {
    const { runId } = req.params;
    const format = (req.query.format as ExportFormat) || 'json';

    try {
        // Verify ownership
        const run = await prisma.run.findFirst({
            where: {
                id: runId,
                userId: req.user!.id,
            },
        });

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        // Fetch nodes and edges from database
        const [nodes, edges] = await Promise.all([
            prisma.node.findMany({
                where: { runId },
                orderBy: { num: 'asc' },
            }),
            prisma.edge.findMany({
                where: { runId },
                orderBy: { createdSeq: 'asc' },
            }),
        ]);

        // Transform to GraphDelta format
        const graphNodes: Node[] = nodes.map(n => {
            const props = n.props as any || {};
            return {
                id: n.id,
                num: n.num,
                label: n.label || n.key || 'unknown',
                type: n.type as any,
                kind: props.kind || 'call',
                span: n.span,
                parentSpan: null,
                key: n.key,
                startedAt: Number(n.startedAt),
                endedAt: n.endedAt ? Number(n.endedAt) : null,
                duration: props.duration || null,
                startedSeq: n.startedSeq,
                endedSeq: n.endedSeq,
                status: props.status || 'completed',
                data: props.data || {},
                props: {
                    errorCount: props.errorCount || 0,
                    childCount: props.childCount || 0,
                },
            };
        });

        const graphEdges: Edge[] = edges.map(e => {
            const props = e.props as any || {};
            return {
                from: e.fromNodeId,
                to: e.toNodeId,
                ordinal: e.ordinal,
                createdSeq: e.createdSeq,
                kind: e.kind || 'calls',
                createdAt: props.createdAt || 0,
            };
        });

        // Build counter and summary
        const counter: Record<string, number> = {};
        const nodesByType: Record<string, number> = {};
        let errorCount = 0;
        let completedCount = 0;
        let runningCount = 0;

        for (const node of graphNodes) {
            counter[node.kind] = (counter[node.kind] || 0) + 1;
            nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
            if (node.status === 'error') errorCount++;
            else if (node.status === 'completed') completedCount++;
            else runningCount++;
        }

        const delta: GraphDelta = {
            runId,
            atSeq: nodes.length > 0 ? Math.max(...nodes.map(n => n.endedSeq || n.startedSeq)) : 0,
            timestamp: Date.now(),
            nodes: graphNodes,
            edges: graphEdges,
            counter,
            summary: {
                totalNodes: graphNodes.length,
                totalEdges: graphEdges.length,
                errorCount,
                completedCount,
                runningCount,
                nodesByType,
            },
        };

        // Export in requested format
        const output = exportForLLM(delta, format);

        if (format === 'prompt') {
            res.type('text/plain').send(output);
        } else {
            res.type('application/json').send(output);
        }
    } catch (err) {
        console.error('[run] Error exporting for LLM:', err);
        res.status(500).json({ error: 'Failed to export graph' });
    }
})

/**
 * Get the latest snapshot for a run
 */
runRouter.get("/run/:runId/snapshot", authenticate(), rateLimit(), requireScopes('run:read'), async (req, res) => {
    const { runId } = req.params;

    try {
        // Verify ownership
        const run = await prisma.run.findFirst({
            where: {
                id: runId,
                userId: req.user!.id,
            },
        });

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        const snapshot = await prisma.snapshot.findFirst({
            where: { runId },
            orderBy: { ts: 'desc' },
        });

        if (!snapshot) {
            return res.status(404).json({ error: 'No snapshot found' });
        }

        res.json(snapshot.graph);
    } catch (err) {
        console.error('[run] Error fetching snapshot:', err);
        res.status(500).json({ error: 'Failed to fetch snapshot' });
    }
})
