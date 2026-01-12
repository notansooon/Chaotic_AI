import type { TalEvent } from './t1_parser.js';


export type Node = {
    id: string;
    label: string;
}

export type Edge = {
    from: string;
    to: string;
}
export type GraphState = {
    lastSeq: number;
    node: Map<string, {id: string, label: string}>;
    edges: Array<{ from : string, to: string }>;
    edgeSet: Set<string>; // Optimization for O(1) duplicate checks
    counter: Map<string, number>;
};

export function initState(): GraphState {
    return {
        lastSeq: -1,
        node: new Map(),
        edges: [],
        edgeSet: new Set(),
        counter: new Map(),
    }
}


export function applyEvent(state: GraphState, event: TalEvent) {
    if (event.seq <= state.lastSeq) {
        return;
    }

    state.lastSeq = event.seq;
    const nodeId = event.nodeKey ?? `event:${event.kind}:${event.seq}`;

    if (!state.node.has(nodeId)) {
        state.node.set(nodeId, { id: nodeId, label: event.kind });
        state.counter.set(nodeId, (state.counter.get(event.kind) ?? 0) + 1);
    }
    

    if (event.parentSpan) {
        const edgeKey = `${event.parentSpan}->${nodeId}`;
        if (!state.edgeSet.has(edgeKey)) {
            state.edges.push({ from: event.parentSpan, to: nodeId });
            state.edgeSet.add(edgeKey);
        }
    }

    state.counter.set(event.kind, (state.counter.get(event.kind) ?? 0) + 1);
}


export type GraphDelta = {
    runId: string;
    atSeq: number;
    nodes: Node[];
    edges: Edge[];
    counter: Record<string, number>;

}



export function buildDelta(runId: string, state: GraphState) {
    return {
        runId, 
        atSeq: state.lastSeq,
        nodes: Array.from(state.node.values()),
        edges: state.edges.slice(),
        counter: Object.fromEntries(state.counter.entries()),
    }
}
