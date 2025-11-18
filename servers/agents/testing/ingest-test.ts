import dotenv from 'dotenv';
dotenv.config();

const Agent_URL = process.env.AGENT_URL || 'http://localhost:8081';
const RUN_ID = 'test-run';

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
    const events = buildEvent(RUN_ID);

    const NDJSON = events.map( (e) => {
        JSON.stringify(e)
    }).join('\n') + '\n';


    const res = await fetch(`${Agent_URL}/ingest/tal`, {
        method: 'GET',
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
    console.log("Error in main {ingest-test}")
    process.exit(1)
})