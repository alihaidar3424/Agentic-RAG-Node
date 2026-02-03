# Agentic Weaviate Assessment

Node.js app with a LangGraph delegating agent, RAG over Weaviate (multi-tenant), and a mock Chart.js tool. Exposes a streamed `/chat` API.

## Tech Stack

- **Node.js** (ESM)
- **Express** — HTTP server
- **Weaviate** — Vector DB (Docker, multi-tenant, no vectorizer)
- **LangGraph** — Agent graph (router → direct / RAG / chart / parallel)
- **LangChain** — Core / Google GenAI
- **Zod** — Validation

## Prerequisites

- Node.js 20+
- Docker & Docker Compose

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd "Agentic Weaviat Assesment"
npm install
```

### 2. Environment

Copy the example env and set values:

```bash
cp .env.example .env
```

Edit `.env`:

| Variable        | Description                | Example        |
|----------------|----------------------------|----------------|
| `WEAVIATE_HOST`| Weaviate host:port         | `localhost:8080` |
| `TENANT_ID`    | Multi-tenant partition     | `tenant-1`     |
| `GOOGLE_API_KEY` | (Optional) Google API key | —              |

### 3. Start Weaviate

```bash
docker compose up -d
```

### 4. Create schema and seed data

```bash
npm run weaviate:setup
```

This creates the multi-tenant `QnA` collection, ensures the tenant from `TENANT_ID`, and inserts 3 sample Q&A rows.

### 5. Run the server

```bash
npm run dev
```

Server listens on **http://localhost:3000**.

## Scripts

| Command                | Description                    |
|------------------------|--------------------------------|
| `npm run dev`         | Start server with nodemon     |
| `npm run weaviate:setup` | Create schema, tenant, seed | 

## API

### GET `/health`

Health check.

```bash
curl http://localhost:3000/health
```

### POST `/chat`

Chat with the delegating agent. Body: `{ "query": "string" }`.  
Response: **NDJSON stream** (`Content-Type: application/x-ndjson`).

- Each line: `{ "answer": "<chunk>", "data": [] }` (answer in ~40-char chunks).
- Final line: `{ "answer": "", "data": <array> }` with all references (RAG and/or Chart.js config).

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "what does the refund policy say from the docs?"}'
```

**Routing (by keywords in query):**

- **Chart** — e.g. “chart”, “graph”, “plot”, “visual” → Chart.js tool (mock config).
- **RAG** — e.g. “from the docs”, “from database”, “refund”, “policy” → Weaviate QnA retrieval.
- **Both** — chart + RAG in parallel, then combined answer and `data`.
- **Direct** — short direct reply when no chart/RAG terms.

## Project Structure

```
src/
├── server.js              # Express app, GET /health, POST /chat
├── agents/
│   ├── router.js          # decideRoute(query) → wantsChart, wantRag, wantsBoth, direct
│   └── delegrationGraph.js # LangGraph: router, directAnswer, ragAgent, chartTool, parallel, combine
├── tools/
│   └── chart.js           # ChartJsTool(input) → mock Chart.js config
└── weaviate/
    ├── client.js          # Weaviate client (connectToLocal)
    ├── schema.js          # createSchema(), ensureTenant(tenantId)
    ├── seed.js            # seedData(tenantId) — 3 sample objects
    ├── setupRunner.js     # createSchema → ensureTenant → seedData
    └── rag.js             # ragRetrieverAndAnswer({ tenantId, query }) → answer, references, rawHits
```

## Requirements

See [requirement.md](./requirement.md) for the full specification (Weaviate schema, LangGraph agents, RAG, Chart tool, response format).
