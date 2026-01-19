import type { TalEvent } from './t1_parser.js';

/**
 * Node types for categorizing execution graph nodes
 */
export type NodeType = 'Function' | 'External' | 'IO' | 'Service' | 'DB' | 'Group' | 'Event' | 'Error';

/**
 * Enriched Node structure for LLM consumption
 * Contains all semantic information needed for understanding code execution
 */
export type Node = {
    id: string;
    num: number;              // Chronological node number
    label: string;            // Human-readable label (function name, etc.)
    type: NodeType;           // Node categorization
    kind: string;             // Original event kind
    span: string | null;      // Span ID for correlation
    parentSpan: string | null; // Parent span for hierarchy
    key: string | null;       // Stable key (file:func) for analytics
    startedAt: number;        // Timestamp when node started (ms)
    endedAt: number | null;   // Timestamp when node ended (ms)
    duration: number | null;  // Duration in ms (computed)
    startedSeq: number;       // First event sequence for this node
    endedSeq: number | null;  // Last event sequence for this node
    status: 'running' | 'completed' | 'error'; // Execution status
    data: Record<string, any>; // Additional context (args, return values, etc.)
    props: {                  // Computed properties for analytics
        errorCount: number;
        childCount: number;
    };
}

/**
 * Edge structure with rich metadata
 */
export type Edge = {
    from: string;
    to: string;
    ordinal: number;          // Edge number from source node
    createdSeq: number;       // Sequence when edge was created
    kind: string;             // Edge type: calls | returns | emits | reads | writes
    createdAt: number;        // Timestamp when edge was created
}

/**
 * Graph state maintained during event processing
 */
export type GraphState = {
    lastSeq: number;
    nodeNum: number;                    // Counter for node numbering
    nodes: Map<string, Node>;           // Nodes keyed by ID
    spanToNode: Map<string, string>;    // Maps span IDs to node IDs
    edges: Edge[];
    edgeSet: Set<string>;               // O(1) duplicate edge checks
    edgeOrdinals: Map<string, number>;  // Track ordinals per source node
    counter: Map<string, number>;       // Event kind counters
};

/**
 * Initialize a fresh graph state
 */
export function initState(): GraphState {
    return {
        lastSeq: -1,
        nodeNum: 0,
        nodes: new Map(),
        spanToNode: new Map(),
        edges: [],
        edgeSet: new Set(),
        edgeOrdinals: new Map(),
        counter: new Map(),
    }
}

/**
 * Determine node type from event kind and data
 */
function inferNodeType(event: TalEvent): NodeType {
    const kind = event.kind.toLowerCase();
    const data = event.data || {};

    // Check for error events
    if (kind === 'error' || kind === 'exception' || data.status === 'ERROR') {
        return 'Error';
    }

    // Check for database operations
    if (data.type === 'database' || data['db.system'] || data['db.statement']) {
        return 'DB';
    }

    // Check for HTTP/external calls
    if (data.type === 'http' || data.type === 'client' || data['http.method']) {
        return 'External';
    }

    // Check for I/O operations
    if (data.type === 'io' || kind.includes('read') || kind.includes('write')) {
        return 'IO';
    }

    // Check for service/RPC calls
    if (data.type === 'rpc' || data.type === 'server' || data['rpc.system']) {
        return 'Service';
    }

    // Function calls
    if (kind === 'call_start' || kind === 'call_end' || kind === 'call') {
        return 'Function';
    }

    // Generic event
    return 'Event';
}

/**
 * Process a single TAL event and update graph state
 * Handles all event types: call_start, call_end, error, event, etc.
 */
export function applyEvent(state: GraphState, event: TalEvent) {
    // Skip duplicate/out-of-order events
    if (event.seq <= state.lastSeq) {
        return;
    }

    state.lastSeq = event.seq;
    const timestamp = typeof event.ts === 'bigint' ? Number(event.ts) : event.ts;

    // Increment counter for this event kind
    state.counter.set(event.kind, (state.counter.get(event.kind) ?? 0) + 1);

    // Determine node ID - prefer nodeKey for stability, fallback to span, then synthetic
    const nodeId = event.nodeKey
        ?? (event.span ? `span:${event.span}` : `event:${event.kind}:${event.seq}`);

    // Handle call_end events - update existing node instead of creating new one
    if (event.kind === 'call_end' && event.span) {
        const existingNodeId = state.spanToNode.get(event.span);
        if (existingNodeId) {
            const existingNode = state.nodes.get(existingNodeId);
            if (existingNode) {
                existingNode.endedAt = timestamp;
                existingNode.endedSeq = event.seq;
                existingNode.duration = existingNode.endedAt - existingNode.startedAt;

                // Check for error status
                const data = event.data || {};
                if (data.status === 'ERROR') {
                    existingNode.status = 'error';
                    existingNode.props.errorCount++;
                } else {
                    existingNode.status = 'completed';
                }

                // Merge end data
                existingNode.data = { ...existingNode.data, ...data };
                return;
            }
        }
    }

    // Create new node if doesn't exist
    if (!state.nodes.has(nodeId)) {
        state.nodeNum++;

        const nodeType = inferNodeType(event);
        const isError = event.kind === 'error' || event.kind === 'exception';

        const node: Node = {
            id: nodeId,
            num: state.nodeNum,
            label: event.nodeKey || event.kind,
            type: nodeType,
            kind: event.kind,
            span: event.span || null,
            parentSpan: event.parentSpan || null,
            key: event.nodeKey || null,
            startedAt: timestamp,
            endedAt: null,
            duration: null,
            startedSeq: event.seq,
            endedSeq: null,
            status: isError ? 'error' : 'running',
            data: event.data || {},
            props: {
                errorCount: isError ? 1 : 0,
                childCount: 0,
            },
        };

        state.nodes.set(nodeId, node);

        // Map span to node for later correlation
        if (event.span) {
            state.spanToNode.set(event.span, nodeId);
        }
    }

    // Create edge from parent to this node
    if (event.parentSpan) {
        // First, try to find parent node by span mapping
        let parentNodeId = state.spanToNode.get(event.parentSpan);

        // If no mapping exists, check if we have a node with this span as ID
        if (!parentNodeId && state.nodes.has(`span:${event.parentSpan}`)) {
            parentNodeId = `span:${event.parentSpan}`;
        }

        // Only create edge if parent node exists (fixes orphaned edges)
        if (parentNodeId && state.nodes.has(parentNodeId)) {
            const edgeKey = `${parentNodeId}->${nodeId}`;

            if (!state.edgeSet.has(edgeKey)) {
                // Calculate ordinal for this source node
                const ordinal = (state.edgeOrdinals.get(parentNodeId) ?? 0) + 1;
                state.edgeOrdinals.set(parentNodeId, ordinal);

                const edge: Edge = {
                    from: parentNodeId,
                    to: nodeId,
                    ordinal,
                    createdSeq: event.seq,
                    kind: determineEdgeKind(event),
                    createdAt: timestamp,
                };

                state.edges.push(edge);
                state.edgeSet.add(edgeKey);

                // Update parent's child count
                const parentNode = state.nodes.get(parentNodeId);
                if (parentNode) {
                    parentNode.props.childCount++;
                }
            }
        } else if (event.parentSpan) {
            // Parent span exists but no node yet - create a placeholder edge
            // This handles cases where child events arrive before parent
            const placeholderParentId = `span:${event.parentSpan}`;
            const edgeKey = `${placeholderParentId}->${nodeId}`;

            if (!state.edgeSet.has(edgeKey)) {
                // Create placeholder parent node if it doesn't exist
                if (!state.nodes.has(placeholderParentId)) {
                    state.nodeNum++;
                    const placeholderNode: Node = {
                        id: placeholderParentId,
                        num: state.nodeNum,
                        label: `pending:${event.parentSpan}`,
                        type: 'Function',
                        kind: 'pending',
                        span: event.parentSpan,
                        parentSpan: null,
                        key: null,
                        startedAt: timestamp,
                        endedAt: null,
                        duration: null,
                        startedSeq: event.seq,
                        endedSeq: null,
                        status: 'running',
                        data: {},
                        props: { errorCount: 0, childCount: 1 },
                    };
                    state.nodes.set(placeholderParentId, placeholderNode);
                    state.spanToNode.set(event.parentSpan, placeholderParentId);
                }

                const ordinal = (state.edgeOrdinals.get(placeholderParentId) ?? 0) + 1;
                state.edgeOrdinals.set(placeholderParentId, ordinal);

                const edge: Edge = {
                    from: placeholderParentId,
                    to: nodeId,
                    ordinal,
                    createdSeq: event.seq,
                    kind: determineEdgeKind(event),
                    createdAt: timestamp,
                };

                state.edges.push(edge);
                state.edgeSet.add(edgeKey);
            }
        }
    }
}

/**
 * Determine edge kind based on event type
 */
function determineEdgeKind(event: TalEvent): string {
    const kind = event.kind.toLowerCase();
    const data = event.data || {};

    if (kind.includes('call')) return 'calls';
    if (kind.includes('return')) return 'returns';
    if (kind.includes('emit') || kind.includes('event')) return 'emits';
    if (kind.includes('read') || data.type === 'read') return 'reads';
    if (kind.includes('write') || data.type === 'write') return 'writes';
    if (data.type === 'database' || data['db.system']) return 'queries';
    if (data.type === 'http') return 'requests';

    return 'calls';
}

/**
 * GraphDelta structure - enriched for LLM consumption
 */
export type GraphDelta = {
    runId: string;
    atSeq: number;
    timestamp: number;
    nodes: Node[];
    edges: Edge[];
    counter: Record<string, number>;
    summary: {
        totalNodes: number;
        totalEdges: number;
        errorCount: number;
        completedCount: number;
        runningCount: number;
        nodesByType: Record<string, number>;
    };
}

/**
 * Build a GraphDelta from current state
 * This is the format that gets published and can be consumed by LLM
 */
export function buildDelta(runId: string, state: GraphState): GraphDelta {
    const nodes = Array.from(state.nodes.values());

    // Compute summary statistics
    const nodesByType: Record<string, number> = {};
    let errorCount = 0;
    let completedCount = 0;
    let runningCount = 0;

    for (const node of nodes) {
        nodesByType[node.type] = (nodesByType[node.type] ?? 0) + 1;

        if (node.status === 'error') errorCount++;
        else if (node.status === 'completed') completedCount++;
        else runningCount++;

        errorCount += node.props.errorCount;
    }

    return {
        runId,
        atSeq: state.lastSeq,
        timestamp: Date.now(),
        nodes,
        edges: state.edges.slice(),
        counter: Object.fromEntries(state.counter.entries()),
        summary: {
            totalNodes: nodes.length,
            totalEdges: state.edges.length,
            errorCount,
            completedCount,
            runningCount,
            nodesByType,
        },
    };
}
