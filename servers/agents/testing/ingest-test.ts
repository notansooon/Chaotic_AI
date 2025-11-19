import dotenv from 'dotenv';
dotenv.config();

const PORT = Number(process.env.WS_PORT) || 4000;
const Agent_URL =  `http://localhost:${PORT}`;
const RUN_ID = process.argv[2];

if (!RUN_ID) {
    throw new Error("Missing RUN_ID")
}

type TalEvent = {
    runId: string;
    seq: number;
    ts: number;
    kind: string;
    span?: string;
    parentSpan?: string;
    nodeKey?: string;
    file?: string;
    line?: number;
    data?: unknown;
    code?: unknown;
}


function buildEvent(runId: string): TalEvent[] {

    const now = Date.now();

    return [
        {
            runId,
            seq: 0,
            ts: now,
            kind: 'RunStart',
            span: 'main',
            nodeKey: 'main'
        },
        {
            runId,
            seq: 1,
            ts: now + 5,
            kind: 'call',
            span: 'loadData',

        }
    ]
}



async function main() {
    console.log('[ingest-test] starting, RUN_ID = ', RUN_ID)
    console.log('[Ingest-test AGENT_URL =', Agent_URL)

    const events = buildEvent(RUN_ID);
    console.log('Buidling Event....')

    const NDJSON = events.map( (e) => {
        return JSON.stringify(e)
    }).join('\n') + '\n';

    console.log('[ingest-test] Event = ', Event)
    console.log('[ingest-test] NDJSON = ', NDJSON)

    const res = await fetch(`${Agent_URL}/ingest/tal`, {
        method: 'POST',
        headers: {
            'content-type': 'application/x-ndjson'
        },
        body: NDJSON,
    });


    console.log('POST /ingest/tal status:', res.status, res.statusText)

    const text =  await res.text()

    if (text) {
        console.log("Response body", text)
    }


}


main().catch((err) => {
    console.log("Error in main {ingest-test}", err)
    process.exit(1)
})