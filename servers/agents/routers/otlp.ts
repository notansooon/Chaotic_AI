/**
 * OTLP (OpenTelemetry Protocol) ingest endpoint
 *
 * Accepts traces from OpenTelemetry auto-instrumentation running
 * inside containers and feeds them into the TAL pipeline.
 *
 * Endpoint: POST /v1/traces
 * Content-Type: application/json
 */

import { Router } from "express";
import { redis } from "../storage/redis.js";
import { otlpToTal, type TalEvent } from "../transforms/otlpToTal.js";

export const otlpRouter = Router();

// Standard OTLP traces endpoint (JSON format)
otlpRouter.post("/traces", async (req, res) => {
    const startTime = Date.now();

    try {
        const otlpData = req.body;

        // Validate basic structure
        if (!otlpData || !otlpData.resourceSpans) {
            res.status(400).json({
                error: "Invalid OTLP data: missing resourceSpans"
            });
            return;
        }

        // Transform OTLP spans to TAL events
        const talEvents = otlpToTal(otlpData);

        if (talEvents.length === 0) {
            // OTLP expects partial success response even for empty data
            res.status(200).json({ partialSuccess: {} });
            return;
        }

        // Group events by runId for efficient Redis pipelining
        const eventsByRun = new Map<string, TalEvent[]>();
        for (const event of talEvents) {
            const existing = eventsByRun.get(event.runId) || [];
            existing.push(event);
            eventsByRun.set(event.runId, existing);
        }

        // Add events to Redis streams
        const pipeline = redis.pipeline();
        for (const [runId, events] of eventsByRun) {
            for (const event of events) {
                pipeline.xadd(
                    `tal:${runId}`,
                    '*',
                    'e', JSON.stringify(event)
                );
            }
        }

        await pipeline.exec();

        const processingTime = Date.now() - startTime;
        console.log(`[otlp] ingested ${talEvents.length} events for ${eventsByRun.size} run(s) in ${processingTime}ms`);

        // Standard OTLP success response
        res.status(200).json({ partialSuccess: {} });

    } catch (err) {
        console.error("[otlp] ingest error:", err);
        res.status(500).json({
            error: "Failed to process OTLP data",
            message: err instanceof Error ? err.message : "Unknown error"
        });
    }
});

// Health check for OTLP endpoint
otlpRouter.get("/traces", (req, res) => {
    res.status(200).json({
        status: "ok",
        endpoint: "otlp/v1/traces",
        supportedContentTypes: ["application/json"],
        note: "Use POST to submit traces"
    });
});
