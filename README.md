# Kyntrix

Run any Python or Node.js script and get a visual, real-time call graph of everything that happened inside it — every function call, database query, external request, and I/O operation, in exact order.

---

## What It Does

You hand Kyntrix a script and an entry point. It runs the code in an isolated container, automatically instruments it with OpenTelemetry, and reconstructs a call graph from the telemetry events as they stream in. You see the graph live in a web UI as execution progresses.

1. Code runs inside an isolated Linux container (PID, network, and mount namespace isolation)
2. OpenTelemetry auto-instruments all function calls, I/O, DB queries, and external requests
3. Telemetry events stream in real-time to the API server
4. A two-stage pipeline (parse → correlate) reconstructs a call graph of nodes and edges
5. The graph is persisted to PostgreSQL and broadcast live over WebSocket
6. View it in the web UI, or export it as JSON / plain text / JSON-LD

---

## Architecture

```
┌─────────────────────────────────────────┐
│         Web Frontend (Next.js)          │  :3000
│  - Call graph visualization             │
│  - Real-time updates via WebSocket      │
└──────────────────┬──────────────────────┘
                   │ HTTP + WebSocket
┌──────────────────▼──────────────────────┐
│           API Server (Node.js)          │  :7090
│  - REST API (runs, graphs, export)      │
│  - Event ingestion (/ingest/tal)        │
│  - T1 Parser → T2 Correlator pipeline  │
│  - WebSocket hub (5 Hz graph deltas)   │
│  - PostgreSQL + Redis persistence       │
└──────────────────┬──────────────────────┘
         ┌─────────┴─────────┐
         │                   │
┌────────▼────────┐  ┌───────▼────────┐
│ Instance Manager│  │   PostgreSQL   │
│   (Node.js)     │  │    + Redis     │
│  :3001          │  │  :5432 / :6379 │
│ - Accepts run   │  └────────────────┘
│   requests      │
│ - File upload & │
│   git clone     │
│ - Daemon bridge │
└────────┬────────┘
         │ Unix socket
┌────────▼────────┐
│  Daemon (C++)   │
│ - Process mgr   │
│ - Spawns        │
│   containers    │
└────────┬────────┘
         │ clone() + namespaces
┌────────▼────────┐
│   Container     │
│ - Python / Node │
│ - OTel enabled  │
│ - Isolated FS   │
└─────────────────┘
```

---

## Services

| Service | Path | Port | Description |
|---|---|---|---|
| Web Frontend | [main/](main/) | 3000 | Next.js UI for call graph visualization |
| API Server | [servers/agents/](servers/agents/) | 7090 | Core API, event pipeline, WebSocket hub |
| Instance Manager | [servers/instance-manager/](servers/instance-manager/) | 3001 | Execution request handler |
| Daemon | [runtime/daemon/](runtime/daemon/) | Unix socket | C++ process/container orchestrator |
| Container Runtime | [runtime/container/](runtime/container/) | — | C++ Linux namespace helpers |

---

## Execution Modes

**File Upload** — provide source files + entry point directly:
```json
{
  "execution_mode": "files",
  "language": "python",
  "entry_point": "main.py",
  "files": { "main.py": "..." }
}
```

**Git** — provide a repo URL, commit SHA, and entry point:
```json
{
  "execution_mode": "git",
  "git_url": "https://github.com/your/repo",
  "commit_sha": "abc123...",
  "branch": "main",
  "entry_point": "main.py"
}
```

Git repos are cached at `/cache/repos/{commitSha}` to avoid redundant clones.

---

## Event Pipeline

Raw telemetry flows through a two-stage pipeline inside the API server:

```
Script (OTel) → HTTP POST /ingest/tal
    │
    ▼
T1 Parser        — validates JSON-Lines event schema
    │
    ▼  Redis Stream (buffered, 512-event batches)
    │
T2 Correlator    — correlates events into nodes + edges by span ID
    │              infers node types: Function | External | IO | Service | DB
    │
Persistence      — writes graph to PostgreSQL every 5s
                   saves full snapshots every 60s (for fast reload)
                   cursor-tracked for idempotent resume
```

Real-time graph deltas are published via Redis pub/sub and broadcast to browsers at 5 Hz over WebSocket.

---

## Database Schema

Core models in [database/prisma/schema.prisma](database/prisma/schema.prisma):

- **Run** — one traced execution (`running | completed | error`)
- **Event** — raw telemetry event (ordered by `seq`, correlated by `span`)
- **Node** — single call instance shown in the UI (numbered `[1]`, `[2]`, ...)
- **Edge** — caller → callee relationship (`calls | reads | writes | emits`)
- **Snapshot** — periodic full graph saves for fast page load
- **Cursor** — ingestion watermark for idempotent resume
- **ApiKey** — CLI authentication (SHA-256 hashed, scope-based)
- **User** — accounts with tier (`free | pro | enterprise`) and Stripe billing

---

## Graph Export Formats

Query `GET /api/run/:runId/llm` to get the call graph in three formats:

- **JSON** — structured graph data for programmatic use
- **Prompt** — human-readable text (e.g. for feeding into an LLM)
- **JSON-LD** — linked data format

---

## Authentication

API keys use the prefix `kyx_live_` or `kyx_test_` and are stored as SHA-256 hashes. Default scopes: `run:create`, `run:read`, `run:delete`. Rate limit: 100 req/min per key.

---

## Local Development

Start all services with Docker Compose:

```bash
cd infra/compose
docker compose -f docker-compose.dev.yml up
```

Services that start:
- `postgres` — PostgreSQL 15 on :5432
- `redis` — Redis 7 on :6379
- `agents` — API Server on :7090
- `daemon` — C++ daemon (privileged, Unix socket)
- `instance-manager` — Instance Manager on :3001
- `web` — Next.js frontend on :3000

The daemon container runs in `privileged` mode — required for Linux namespace creation (`clone()` with `CLONE_NEWNS`, `CLONE_NEWPID`, `CLONE_NEWNET`).

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Linux namespaces (not Docker) | Lightweight isolation without full VM overhead |
| Custom TAL event format | Lighter than raw OTLP; optimized for graph reconstruction |
| Redis Streams for buffering | Decouples ingestion from processing; survives crashes |
| Periodic graph snapshots | Fast page load without replaying all events from scratch |
| SHA-256 hashed API keys | Never store raw keys; safe prefix for identification |

---

## Project Structure

```
/
├── main/                  # Next.js web frontend
├── servers/
│   ├── agents/            # Core API + event pipeline
│   └── instance-manager/  # Execution request handler
├── runtime/
│   ├── daemon/            # C++ process orchestrator
│   └── container/         # C++ namespace/container helpers
├── adapters/
│   ├── python-embedded/   # Python OTel instrumentation
│   └── node-embedded/     # Node.js OTel instrumentation
├── packages/
│   └── cli/               # kyntrix CLI binary
├── database/
│   └── prisma/            # PostgreSQL schema
└── infra/
    └── compose/           # Docker Compose configs
```
