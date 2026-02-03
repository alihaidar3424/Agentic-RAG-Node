import "dotenv/config";
import express from "express";
import { buildDelegationGraph } from "./agents/delegrationGraph.js";

const app = express();
const PORT = 3000;
const CHUNK_SIZE = 40;
const tenantId = process.env.TENANT_ID || "tenant-a";

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.post("/chat", async (req, res) => {
  const query = req.body?.query;
  if (query == null || typeof query !== "string") {
    res.status(400).json({ error: "Missing or invalid body: { query: string }" });
    return;
  }

  try {
    const graph = buildDelegationGraph();
    const finalState = await graph.invoke({
      userQuery: query,
      tenantId,
      answer: "",
      data: [],
    });

    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");
    res.flushHeaders?.();

    const answer = finalState.answer ?? "";
    for (let i = 0; i < answer.length; i += CHUNK_SIZE) {
      const chunk = answer.slice(i, i + CHUNK_SIZE);
      res.write(JSON.stringify({ answer: chunk, data: [] }) + "\n");
    }
    res.write(
      JSON.stringify({ answer: "", data: finalState.data ?? [] }) + "\n"
    );
    res.end();
  } catch (err) {
    console.error("[chat]", err);
    res.status(500).json({
      error: err.message ?? "Internal server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
