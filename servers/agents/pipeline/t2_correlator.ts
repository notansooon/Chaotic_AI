import type { TalEvent } from './t1_parser.js';


export type GraphState = {
    lastSeq: number;
    node: Map<string, {id: string, label: string}>;
    edges: Array<{ from : string, to: string }>;
    counter: Map<string, number>;
};

export function initState(): GraphState {
    return {
        lastSeq: -1,
        node: new Map(),
        edges: [],
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
        state.edges.push({ from: event.parentSpan, to: nodeId });
    }

    state.counter.set(event.kind, (state.counter.get(event.kind) ?? 0) + 1);
}

export function buildDelta(runId: string, state: GraphState) {

    return {
        runId, 
        atSeq: state.lastSeq,
        counter: Object.fromEntries(state.counter.entries()),
    }
}


