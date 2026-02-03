# Requirements

## General

### Tech Stack

| Area | Requirement |
|------|-------------|
| **IDE** | Use an Agentic IDE (e.g. Windsurf or Cursor) to work on the task. |
| **LLM** | Use a local LLM instance or the Google Gemini Free Tier API. |
| **Runtime** | The entire system should be built using **Node.js**. |
| **Database** | The Weaviate vector database should be **containerized and run in Docker**. |

### Libraries

- **Weaviate JS client** — For interacting with the Weaviate vector database.
- **LangGraph** — For building the agent hierarchy.
- **LangChain** — For LLM communication and abstraction.

---

## Part 1: Weaviate Vector Database with Multi-Tenancy

1. Set up a Weaviate vector database using Docker.

2. Create a **schema with multi-tenancy** that includes the following fields:

   | Field | Type | Notes |
   |-------|------|--------|
   | `fileId` | string | The identifier for each file. **Not** vectorized or index searchable. |
   | `question` | text | The question being asked. |
   | `answer` | text | The answer to the question. |
   | `pageNumber` | textArray | The page number(s) this answer was derived from (imaginary). |

3. Using the **Weaviate JavaScript client**:
   - Insert **at least three fictional entries** into the vector database.
   - You do **not** have to provide a vector for the entries.

---

## Part 2: LangGraph Hierarchical Agent Setup

### Overview

Set up a LangGraph agent hierarchy consisting of:

1. **Delegating Agent** — Determines the flow based on the user’s query (Chart.js tool, RAG agent, or direct answer).
2. **Chart.js Tool** — A mocked tool that generates a Chart.js configuration based on input data.
3. **RAG Agent** — Retrieval-augmented generation: queries the vector database, retrieves relevant chunks, and returns them with the answer.

### Delegating Agent

The delegating agent receives a user query and decides:

- Whether to **interact with the Chart.js tool** and return a chart configuration.
- Whether to **ask the RAG agent** for relevant information.
- Or to **answer the user directly**.

It should be capable of calling **both** the Chart.js tool and the RAG agent **simultaneously or sequentially** depending on the user’s request.

### Chart.js Tool

- The tool **mocks** generating a Chart.js configuration and returns it.
- For simplicity, it can return a **fixed mock configuration**.

### RAG Agent

- Uses the **Weaviate vector database** to answer questions.
- Fetches relevant chunks and returns both the **answer** and the **files** used (from the fetched objects).
- Must be able to **reference specific files** when giving an answer so the user knows which file and page was used.
- Reference format: **`"1- Page 3"`** when fileId `1` corresponds to the first fileId returned from the agent’s data object.
- **Fallback:** If the embedding model isn’t available, the agent should use the **fetchObjects API** to retrieve the data.

### Delegating Agent Response Schema

The final return schema for this agent should be a **streamed response** in this format:

```json
{
  "answer": "string",
  "data": []
}
```

- **`answer`** — The streaming chunks of the agent’s answer.
- **`data`** — All reference data objects (Chart.js data or RAG references).

When answering a user query, the delegating agent should **always** include:

1. The **answer text**.
2. All **references** used in a separate **data** object.
3. **FileIds and pages** as reference objects when the response is based on RAG or database retrieval.  
   You may decide how to group references with the same `fileId` but different page numbers.
4. The **Chart.js config** when the response involves chart creation.

### Integration and Handling Multiple Tools

- The delegating agent must support **simultaneous or sequential** use of multiple tools.
- If the user request requires **both** charting and data retrieval, the agent should be able to call the Chart.js tool and the RAG agent **in parallel or sequentially**.
- The solution must **combine both responses** (chart tool and RAG agent) and return them together in the final response.
