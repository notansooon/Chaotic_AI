import  WebSocket  from "ws";

const runId = process.argv[2] ?? 'run-demo-1';
const ws = new WebSocket(`ws://localhost:4000/ws?runId=${runId}`);

ws.on('open', () => {
    console.log(`connected to WS for ${runId}`)
}) 

ws.on('message', (data: any) => {
    console.log(`Received ${data}`);

})

ws.on('close', () => {
    console.log("Closed")
})