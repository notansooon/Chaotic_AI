/**
 * LLM Export Utility
 *
 * Converts execution graphs into formats optimized for LLM attention.
 * Designed to help LLMs understand code execution flow rather than
 * just static code text.
 */

import type { GraphDelta, Node, Edge } from './t2_correlator.js';

/**
 * Execution trace format optimized for LLM attention
 *
 * Structure is designed to:
 * 1. Provide clear hierarchical execution flow
 * 2. Include timing context for understanding performance
 * 3. Highlight errors and their propagation
 * 4. Map back to source code locations
 */
export interface LLMExecutionTrace {
    // Metadata for context
    meta: {
        runId: string;
        timestamp: number;
        totalDuration: number | null;
        status: 'running' | 'completed' | 'error';
    };

    // Summary statistics for quick overview
    summary: {
        totalCalls: number;
        completedCalls: number;
        errorCalls: number;
        pendingCalls: number;
        callsByType: Record<string, number>;
        hotspots: Array<{
            label: string;
            duration: number;
            percentage: number;
        }>;
    };

    // Hierarchical call tree (easier for LLM to understand than flat graph)
    callTree: LLMCallNode[];

    // Flat list of errors for easy error analysis
    errors: LLMError[];

    // Execution timeline for understanding flow
    timeline: LLMTimelineEntry[];

    // Raw graph data for detailed analysis
    graph: {
        nodes: LLMNode[];
        edges: LLMEdge[];
    };
}

export interface LLMCallNode {
    id: string;
    num: number;
    name: string;
    type: string;
    status: string;
    duration: number | null;
    startedAt: number;
    endedAt: number | null;
    children: LLMCallNode[];
    data: Record<string, any>;
    errorMessage?: string;
}

export interface LLMNode {
    id: string;
    num: number;
    name: string;
    type: string;
    status: string;
    timing: {
        startedAt: number;
        endedAt: number | null;
        duration: number | null;
    };
    context: Record<string, any>;
}

export interface LLMEdge {
    caller: string;
    callee: string;
    type: string;
    timestamp: number;
}

export interface LLMError {
    nodeId: string;
    nodeName: string;
    timestamp: number;
    message?: string;
    stack?: string;
    context: Record<string, any>;
}

export interface LLMTimelineEntry {
    timestamp: number;
    event: 'call_start' | 'call_end' | 'error' | 'event';
    nodeId: string;
    nodeName: string;
    details?: string;
}

/**
 * Convert GraphDelta to LLM-optimized execution trace
 */
export function graphToLLMTrace(delta: GraphDelta): LLMExecutionTrace {
    const nodes = delta.nodes;
    const edges = delta.edges;

    // Build node lookup
    const nodeMap = new Map<string, Node>();
    for (const node of nodes) {
        nodeMap.set(node.id, node);
    }

    // Build parent-child relationships
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();

    for (const edge of edges) {
        if (!childrenMap.has(edge.from)) {
            childrenMap.set(edge.from, []);
        }
        childrenMap.get(edge.from)!.push(edge.to);
        parentMap.set(edge.to, edge.from);
    }

    // Find root nodes (nodes with no parent)
    const rootNodes: Node[] = [];
    for (const node of nodes) {
        if (!parentMap.has(node.id)) {
            rootNodes.push(node);
        }
    }

    // Build call tree recursively
    function buildCallTree(node: Node): LLMCallNode {
        const childIds = childrenMap.get(node.id) || [];
        const children = childIds
            .map(id => nodeMap.get(id))
            .filter((n): n is Node => n !== undefined)
            .map(buildCallTree);

        const errorData = node.data || {};
        const errorMessage = errorData['exception.message'] ||
            errorData['error'] ||
            errorData['statusMessage'] ||
            undefined;

        return {
            id: node.id,
            num: node.num,
            name: node.label,
            type: node.type,
            status: node.status,
            duration: node.duration,
            startedAt: node.startedAt,
            endedAt: node.endedAt,
            children,
            data: node.data,
            errorMessage: node.status === 'error' ? errorMessage : undefined,
        };
    }

    const callTree = rootNodes.map(buildCallTree);

    // Calculate total duration
    let minStart = Infinity;
    let maxEnd = 0;
    for (const node of nodes) {
        if (node.startedAt < minStart) minStart = node.startedAt;
        if (node.endedAt && node.endedAt > maxEnd) maxEnd = node.endedAt;
    }
    const totalDuration = maxEnd > minStart ? maxEnd - minStart : null;

    // Collect errors
    const errors: LLMError[] = nodes
        .filter(n => n.status === 'error' || n.type === 'Error')
        .map(n => {
            const errorData = n.data || {};
            return {
                nodeId: n.id,
                nodeName: n.label,
                timestamp: n.startedAt,
                message: errorData['exception.message'] || errorData['error'] || errorData['statusMessage'],
                stack: errorData['exception.stacktrace'],
                context: n.data,
            };
        });

    // Build timeline
    const timeline: LLMTimelineEntry[] = [];

    for (const node of nodes) {
        // Call start
        timeline.push({
            timestamp: node.startedAt,
            event: 'call_start',
            nodeId: node.id,
            nodeName: node.label,
            details: `${node.type} started`,
        });

        // Call end
        if (node.endedAt) {
            const event = node.status === 'error' ? 'error' : 'call_end';
            timeline.push({
                timestamp: node.endedAt,
                event,
                nodeId: node.id,
                nodeName: node.label,
                details: node.duration ? `${node.type} ${node.status} (${node.duration}ms)` : `${node.type} ${node.status}`,
            });
        }
    }

    // Sort timeline by timestamp
    timeline.sort((a, b) => a.timestamp - b.timestamp);

    // Calculate hotspots (slowest calls)
    const completedNodes = nodes
        .filter(n => n.duration !== null && n.duration > 0)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0));

    const hotspots = completedNodes.slice(0, 10).map(n => ({
        label: n.label,
        duration: n.duration!,
        percentage: totalDuration ? Math.round((n.duration! / totalDuration) * 100) : 0,
    }));

    // Determine overall status
    let status: 'running' | 'completed' | 'error' = 'completed';
    if (nodes.some(n => n.status === 'error')) {
        status = 'error';
    } else if (nodes.some(n => n.status === 'running')) {
        status = 'running';
    }

    return {
        meta: {
            runId: delta.runId,
            timestamp: delta.timestamp,
            totalDuration,
            status,
        },
        summary: {
            totalCalls: nodes.length,
            completedCalls: nodes.filter(n => n.status === 'completed').length,
            errorCalls: nodes.filter(n => n.status === 'error').length,
            pendingCalls: nodes.filter(n => n.status === 'running').length,
            callsByType: delta.summary.nodesByType,
            hotspots,
        },
        callTree,
        errors,
        timeline,
        graph: {
            nodes: nodes.map(n => ({
                id: n.id,
                num: n.num,
                name: n.label,
                type: n.type,
                status: n.status,
                timing: {
                    startedAt: n.startedAt,
                    endedAt: n.endedAt,
                    duration: n.duration,
                },
                context: n.data,
            })),
            edges: edges.map(e => ({
                caller: e.from,
                callee: e.to,
                type: e.kind,
                timestamp: e.createdAt,
            })),
        },
    };
}

/**
 * Convert execution trace to a text format optimized for LLM prompts
 *
 * This format is designed to:
 * - Be easily parsed by language models
 * - Highlight the execution structure
 * - Include all relevant context for understanding
 */
export function traceToLLMPrompt(trace: LLMExecutionTrace): string {
    const lines: string[] = [];

    // Header
    lines.push('# Execution Trace');
    lines.push('');
    lines.push(`Run ID: ${trace.meta.runId}`);
    lines.push(`Status: ${trace.meta.status}`);
    if (trace.meta.totalDuration) {
        lines.push(`Total Duration: ${trace.meta.totalDuration}ms`);
    }
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push(`- Total Calls: ${trace.summary.totalCalls}`);
    lines.push(`- Completed: ${trace.summary.completedCalls}`);
    lines.push(`- Errors: ${trace.summary.errorCalls}`);
    lines.push(`- Running: ${trace.summary.pendingCalls}`);
    lines.push('');

    // Call types breakdown
    lines.push('### Call Types');
    for (const [type, count] of Object.entries(trace.summary.callsByType)) {
        lines.push(`- ${type}: ${count}`);
    }
    lines.push('');

    // Hotspots
    if (trace.summary.hotspots.length > 0) {
        lines.push('### Performance Hotspots');
        for (const hotspot of trace.summary.hotspots) {
            lines.push(`- ${hotspot.label}: ${hotspot.duration}ms (${hotspot.percentage}%)`);
        }
        lines.push('');
    }

    // Errors
    if (trace.errors.length > 0) {
        lines.push('## Errors');
        for (const error of trace.errors) {
            lines.push(`### Error in ${error.nodeName}`);
            if (error.message) {
                lines.push(`Message: ${error.message}`);
            }
            if (error.stack) {
                lines.push('Stack trace:');
                lines.push('```');
                lines.push(error.stack);
                lines.push('```');
            }
            lines.push('');
        }
    }

    // Call Tree
    lines.push('## Call Tree');
    function renderTree(node: LLMCallNode, indent: number = 0): void {
        const prefix = '  '.repeat(indent);
        const status = node.status === 'error' ? ' [ERROR]' : node.status === 'running' ? ' [RUNNING]' : '';
        const duration = node.duration !== null ? ` (${node.duration}ms)` : '';
        lines.push(`${prefix}- [${node.num}] ${node.name}${duration}${status}`);

        if (node.errorMessage) {
            lines.push(`${prefix}  Error: ${node.errorMessage}`);
        }

        for (const child of node.children) {
            renderTree(child, indent + 1);
        }
    }

    for (const root of trace.callTree) {
        renderTree(root);
    }
    lines.push('');

    // Timeline (abbreviated)
    lines.push('## Timeline (first 50 events)');
    const timelineSlice = trace.timeline.slice(0, 50);
    for (const entry of timelineSlice) {
        const time = new Date(entry.timestamp).toISOString();
        lines.push(`- ${time} | ${entry.event} | ${entry.nodeName} | ${entry.details || ''}`);
    }
    if (trace.timeline.length > 50) {
        lines.push(`... and ${trace.timeline.length - 50} more events`);
    }

    return lines.join('\n');
}

/**
 * Convert execution trace to JSON-LD format for semantic understanding
 */
export function traceToJSONLD(trace: LLMExecutionTrace): object {
    return {
        '@context': {
            '@vocab': 'https://kyntrix.io/schema/',
            'xsd': 'http://www.w3.org/2001/XMLSchema#',
            'startedAt': { '@type': 'xsd:dateTime' },
            'endedAt': { '@type': 'xsd:dateTime' },
            'duration': { '@type': 'xsd:integer' },
        },
        '@type': 'ExecutionTrace',
        '@id': `urn:kyntrix:run:${trace.meta.runId}`,
        ...trace,
    };
}

/**
 * Export formats available
 */
export type ExportFormat = 'json' | 'prompt' | 'jsonld';

/**
 * Export graph delta in specified format
 */
export function exportForLLM(delta: GraphDelta, format: ExportFormat = 'json'): string {
    const trace = graphToLLMTrace(delta);

    switch (format) {
        case 'prompt':
            return traceToLLMPrompt(trace);
        case 'jsonld':
            return JSON.stringify(traceToJSONLD(trace), null, 2);
        case 'json':
        default:
            return JSON.stringify(trace, null, 2);
    }
}
