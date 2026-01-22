/**
 * OTLP to TAL (Telemetry Abstraction Layer) transformer
 *
 * Converts OpenTelemetry Protocol spans into Kyntrix TAL events
 * that can be processed by the existing graph pipeline.
 */

// OTLP types (subset of the full spec)
interface OtlpAttributeValue {
    stringValue?: string;
    intValue?: string;
    boolValue?: boolean;
    doubleValue?: number;
    arrayValue?: { values: OtlpAttributeValue[] };
}

interface OtlpAttribute {
    key: string;
    value: OtlpAttributeValue;
}

interface OtlpEvent {
    name: string;
    timeUnixNano: string;
    attributes?: OtlpAttribute[];
}

interface OtlpStatus {
    code?: number;  // 0 = UNSET, 1 = OK, 2 = ERROR
    message?: string;
}

interface OtlpSpan {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: number;  // 0 = UNSPECIFIED, 1 = INTERNAL, 2 = SERVER, 3 = CLIENT, 4 = PRODUCER, 5 = CONSUMER
    startTimeUnixNano: string;
    endTimeUnixNano: string;
    attributes?: OtlpAttribute[];
    status?: OtlpStatus;
    events?: OtlpEvent[];
}

interface OtlpScopeSpans {
    scope?: {
        name?: string;
        version?: string;
    };
    spans: OtlpSpan[];
}

interface OtlpResource {
    attributes?: OtlpAttribute[];
}

interface OtlpResourceSpans {
    resource?: OtlpResource;
    scopeSpans: OtlpScopeSpans[];
}

interface OtlpTraceData {
    resourceSpans: OtlpResourceSpans[];
}

// TAL event type (matches existing pipeline)
export interface TalEvent {
    runId: string;
    seq: number;
    ts: number;
    kind: string;
    span: string;
    parentSpan: string | null;
    nodeKey: string | null;
    data: Record<string, any>;
}

/**
 * Extract primitive value from OTLP attribute value
 */
function extractValue(value: OtlpAttributeValue): any {
    if (value.stringValue !== undefined) {
        return value.stringValue;

    }
        
    if (value.intValue !== undefined) return parseInt(value.intValue, 10);
    if (value.boolValue !== undefined) return value.boolValue;
    if (value.doubleValue !== undefined) return value.doubleValue;
    if (value.arrayValue !== undefined) {
        return value.arrayValue.values.map(extractValue);
    }
    return null;
}

/**
 * Convert OTLP attributes array to key-value object
 */
function attributesToObject(attributes?: OtlpAttribute[]): Record<string, any> {
    if (!attributes) return {};

    const result: Record<string, any> = {};
    for (const attr of attributes) {
        result[attr.key] = extractValue(attr.value);
    }
    return result;
}

/**
 * Convert nanosecond timestamp to milliseconds
 */
function nanoToMs(nanoStr: string): number {
    // Use BigInt for precision, then convert to number
    const nanos = BigInt(nanoStr);
    return Number(nanos / 1_000_000n);
}

/**
 * Determine span type from OTLP kind and attributes
 */
function getSpanType(span: OtlpSpan): string {
    const attrs = attributesToObject(span.attributes);

    // HTTP spans
    if (attrs['http.method'] || attrs['http.url']) {
        return 'http';
    }

    // Database spans
    if (attrs['db.system'] || attrs['db.statement']) {
        return 'database';
    }

    // RPC spans
    if (attrs['rpc.system'] || attrs['rpc.method']) {
        return 'rpc';
    }

    // Based on OTLP kind
    switch (span.kind) {
        case 2: return 'server';
        case 3: return 'client';
        case 4: return 'producer';
        case 5: return 'consumer';
        default: return 'internal';
    }
}

/**
 * Transform OTLP trace data into TAL events
 */
export function otlpToTal(otlpData: OtlpTraceData): TalEvent[] {
    const events: TalEvent[] = [];
    let seq = 0;

    for (const resourceSpan of otlpData.resourceSpans || []) {
        // Extract run_id from resource attributes
        const resourceAttrs = attributesToObject(resourceSpan.resource?.attributes);
        const runId = resourceAttrs['kyntrix.run_id'] || resourceAttrs['service.instance.id'] || 'unknown';

        for (const scopeSpan of resourceSpan.scopeSpans || []) {
            const scopeName = scopeSpan.scope?.name || 'unknown';

            for (const span of scopeSpan.spans || []) {
                const spanAttrs = attributesToObject(span.attributes);
                const spanType = getSpanType(span);
                const startTs = nanoToMs(span.startTimeUnixNano);
                const endTs = nanoToMs(span.endTimeUnixNano);
                const durationMs = endTs - startTs;

                // Emit call_start event
                events.push({
                    runId,
                    seq: seq++,
                    ts: startTs,
                    kind: 'call_start',
                    span: span.spanId,
                    parentSpan: span.parentSpanId || null,
                    nodeKey: span.name,
                    data: {
                        type: spanType,
                        scope: scopeName,
                        traceId: span.traceId,
                        ...spanAttrs
                    }
                });

                // Emit events within the span (exceptions, logs, etc.)
                if (span.events) {
                    for (const event of span.events) {
                        const eventTs = nanoToMs(event.timeUnixNano);
                        const eventAttrs = attributesToObject(event.attributes);

                        events.push({
                            runId,
                            seq: seq++,
                            ts: eventTs,
                            kind: event.name === 'exception' ? 'error' : 'event',
                            span: span.spanId,
                            parentSpan: span.parentSpanId || null,
                            nodeKey: event.name,
                            data: eventAttrs
                        });
                    }
                }

                // Emit call_end event
                const isError = span.status?.code === 2;
                events.push({
                    runId,
                    seq: seq++,
                    ts: endTs,
                    kind: 'call_end',
                    span: span.spanId,
                    parentSpan: span.parentSpanId || null,
                    nodeKey: span.name,
                    data: {
                        durationMs,
                        status: isError ? 'ERROR' : 'OK',
                        statusMessage: span.status?.message || null
                    }
                });
            }
        }
    }

    return events;
}
