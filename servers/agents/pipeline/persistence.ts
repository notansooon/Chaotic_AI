/**
 * Database persistence layer for graph data
 *
 * Persists nodes, edges, and events to PostgreSQL via Prisma
 * for long-term storage and LLM consumption.
 */

import { prisma } from '../db/client.js';
import type { GraphState, Node, Edge } from './t2_correlator.js';

/**
 * Track what's been persisted to avoid duplicate writes
 */
export type PersistenceState = {
    persistedNodes: Set<string>;
    persistedEdges: Set<string>;
    lastPersistedSeq: number;
};

export function initPersistenceState(): PersistenceState {
    return {
        persistedNodes: new Set(),
        persistedEdges: new Set(),
        lastPersistedSeq: -1,
    };
}

/**
 * Ensure a Run record exists in the database
 */
export async function ensureRun(runId: string): Promise<void> {
    await prisma.run.upsert({
        where: { id: runId },
        create: {
            id: runId,
            status: 'running',
            createdAt: new Date(),
        },
        update: {},
    });
}

/**
 * Persist new nodes to the database
 */
export async function persistNodes(
    runId: string,
    nodes: Node[],
    persistState: PersistenceState
): Promise<number> {
    const newNodes = nodes.filter(n => !persistState.persistedNodes.has(n.id));

    if (newNodes.length === 0) {
        return 0;
    }

    const createData = newNodes.map(node => ({
        id: node.id,
        runId,
        num: node.num,
        span: node.span,
        parentId: null, // Will be updated after all nodes exist
        type: node.type,
        label: node.label,
        key: node.key,
        startedSeq: node.startedSeq,
        endedSeq: node.endedSeq,
        startedAt: BigInt(Math.floor(node.startedAt)),
        endedAt: node.endedAt ? BigInt(Math.floor(node.endedAt)) : null,
        props: {
            errorCount: node.props.errorCount,
            childCount: node.props.childCount,
            duration: node.duration,
            status: node.status,
            kind: node.kind,
            data: node.data,
        },
    }));

    await prisma.node.createMany({
        data: createData,
        skipDuplicates: true,
    });

    // Mark as persisted
    for (const node of newNodes) {
        persistState.persistedNodes.add(node.id);
    }

    return newNodes.length;
}

/**
 * Persist new edges to the database
 */
export async function persistEdges(
    runId: string,
    edges: Edge[],
    persistState: PersistenceState
): Promise<number> {
    const newEdges = edges.filter(e => {
        const key = `${e.from}->${e.to}`;
        return !persistState.persistedEdges.has(key);
    });

    if (newEdges.length === 0) {
        return 0;
    }

    const createData = newEdges.map(edge => ({
        runId,
        fromNodeId: edge.from,
        toNodeId: edge.to,
        ordinal: edge.ordinal,
        createdSeq: edge.createdSeq,
        kind: edge.kind,
        props: {
            createdAt: edge.createdAt,
        },
    }));

    await prisma.edge.createMany({
        data: createData,
        skipDuplicates: true,
    });

    // Mark as persisted
    for (const edge of newEdges) {
        const key = `${edge.from}->${edge.to}`;
        persistState.persistedEdges.add(key);
    }

    return newEdges.length;
}

/**
 * Update node end times and status for completed nodes
 */
export async function updateCompletedNodes(
    runId: string,
    nodes: Node[]
): Promise<number> {
    const completedNodes = nodes.filter(n =>
        n.status !== 'running' && n.endedAt !== null
    );

    let updated = 0;

    for (const node of completedNodes) {
        try {
            await prisma.node.update({
                where: { id: node.id },
                data: {
                    endedSeq: node.endedSeq,
                    endedAt: node.endedAt ? BigInt(Math.floor(node.endedAt)) : null,
                    props: {
                        errorCount: node.props.errorCount,
                        childCount: node.props.childCount,
                        duration: node.duration,
                        status: node.status,
                        kind: node.kind,
                        data: node.data,
                    },
                },
            });
            updated++;
        } catch (err) {
            // Node might not exist yet, that's ok
        }
    }

    return updated;
}

/**
 * Update the ingestion cursor for idempotent processing
 */
export async function updateCursor(runId: string, seq: number): Promise<void> {
    await prisma.cursor.upsert({
        where: { runId },
        create: {
            runId,
            appliedSeq: seq,
        },
        update: {
            appliedSeq: seq,
        },
    });
}

/**
 * Save a graph snapshot for fast reload
 */
export async function saveSnapshot(
    runId: string,
    state: GraphState
): Promise<void> {
    const nodes = Array.from(state.nodes.values());
    const edges = state.edges;

    await prisma.snapshot.create({
        data: {
            runId,
            graph: {
                nodes: nodes.map(n => ({
                    id: n.id,
                    num: n.num,
                    label: n.label,
                    type: n.type,
                    kind: n.kind,
                    span: n.span,
                    parentSpan: n.parentSpan,
                    key: n.key,
                    startedAt: n.startedAt,
                    endedAt: n.endedAt,
                    duration: n.duration,
                    startedSeq: n.startedSeq,
                    endedSeq: n.endedSeq,
                    status: n.status,
                    data: n.data,
                    props: n.props,
                })),
                edges: edges.map(e => ({
                    from: e.from,
                    to: e.to,
                    ordinal: e.ordinal,
                    createdSeq: e.createdSeq,
                    kind: e.kind,
                    createdAt: e.createdAt,
                })),
                cursor: {
                    lastSeq: state.lastSeq,
                    nodeNum: state.nodeNum,
                },
            },
        },
    });
}

/**
 * Mark a run as completed
 */
export async function completeRun(runId: string, status: 'completed' | 'error'): Promise<void> {
    await prisma.run.update({
        where: { id: runId },
        data: {
            status,
            endedAt: new Date(),
        },
    });
}

/**
 * Persist all graph data for a run
 * Called periodically or on significant changes
 */
export async function persistGraph(
    runId: string,
    state: GraphState,
    persistState: PersistenceState
): Promise<{ nodesCreated: number; edgesCreated: number; nodesUpdated: number }> {
    // Ensure run exists
    await ensureRun(runId);

    const nodes = Array.from(state.nodes.values());
    const edges = state.edges;

    // Persist new nodes and edges
    const nodesCreated = await persistNodes(runId, nodes, persistState);
    const edgesCreated = await persistEdges(runId, edges, persistState);

    // Update completed nodes
    const nodesUpdated = await updateCompletedNodes(runId, nodes);

    // Update cursor
    if (state.lastSeq > persistState.lastPersistedSeq) {
        await updateCursor(runId, state.lastSeq);
        persistState.lastPersistedSeq = state.lastSeq;
    }

    return { nodesCreated, edgesCreated, nodesUpdated };
}

/**
 * Load existing persistence state from database
 * Used when resuming a run
 */
export async function loadPersistenceState(runId: string): Promise<PersistenceState> {
    const state = initPersistenceState();

    // Load existing nodes
    const existingNodes = await prisma.node.findMany({
        where: { runId },
        select: { id: true },
    });
    for (const node of existingNodes) {
        state.persistedNodes.add(node.id);
    }

    // Load existing edges
    const existingEdges = await prisma.edge.findMany({
        where: { runId },
        select: { fromNodeId: true, toNodeId: true },
    });
    for (const edge of existingEdges) {
        state.persistedEdges.add(`${edge.fromNodeId}->${edge.toNodeId}`);
    }

    // Load cursor
    const cursor = await prisma.cursor.findUnique({
        where: { runId },
    });
    if (cursor) {
        state.lastPersistedSeq = cursor.appliedSeq;
    }

    return state;
}
