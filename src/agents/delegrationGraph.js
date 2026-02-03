import { z } from "zod";
import { StateGraph, Annotation, START, END } from "@langchain/langgraph";
import { decideRoute } from "./router.js";
import { ragRetrieverAndAnswer } from "../weaviate/rag.js";
import { ChartJsTool } from "../tools/chart.js";

// State shape (zod for docs/validation)
export const DelegationStateSchema = z.object({
  userQuery: z.string(),
  tenantId: z.string(),
  answer: z.string(),
  data: z.array(z.any()),
  route: z
    .object({
      wantsChart: z.boolean(),
      wantRag: z.boolean(),
      wantsBoth: z.boolean(),
      direct: z.boolean(),
    })
    .optional(),
});

const StateAnnotation = Annotation.Root({
  userQuery: Annotation(),
  tenantId: Annotation(),
  answer: Annotation(),
  data: Annotation({
    reducer: (left, right) =>
      left.concat(Array.isArray(right) ? right : right != null ? [right] : []),
    default: () => [],
  }),
  route: Annotation(),
});

// --- Nodes ---
async function router(state) {
  const decision = await decideRoute(state.userQuery ?? "");
  return { route: decision };
}

function directAnswer(state) {
  return {
    answer: "Here’s a direct response. If you need a chart or info from the docs, say so.",
  };
}

async function ragAgent(state) {
  const rag = await ragRetrieverAndAnswer({
    tenantId: state.tenantId ?? "",
    query: state.userQuery ?? "",
  });
  const simplifiedHits = (rag.rawHits ?? []).map((h) => {
    const p = h.properties ?? {};
    return {
      fileId: p.fileId,
      question: p.question,
      answer: p.answer,
      pageNumber: p.pageNumber,
    };
  });
  const item = {
    type: "rag_references",
    references: rag.references ?? [],
    rawHits: simplifiedHits,
  };
  return {
    answer: rag.answer ?? "",
    data: item,
  };
}

async function chartTool(state) {
  const config = await ChartJsTool(state.userQuery ?? {});
  const item = {
    type: "bar",
    config: {
      type: config.type,
      data: config.data,
      options: config.options,
      meta: config.meta,
    },
  };
  return { data: item };
}

async function parallel(state) {
  const [rag, chart] = await Promise.all([
    ragRetrieverAndAnswer({
      tenantId: state.tenantId ?? "",
      query: state.userQuery ?? "",
    }),
    ChartJsTool(state.userQuery ?? {}),
  ]);
  const simplifiedHits = (rag.rawHits ?? []).map((h) => {
    const p = h.properties ?? {};
    return {
      fileId: p.fileId,
      question: p.question,
      answer: p.answer,
      pageNumber: p.pageNumber,
    };
  });
  const ragItem = {
    type: "rag_references",
    references: rag.references ?? [],
    rawHits: simplifiedHits,
  };
  const chartItem = {
    type: "bar",
    config: {
      type: chart.type,
      data: chart.data,
      options: chart.options,
      meta: chart.meta,
    },
  };
  return {
    answer: rag.answer ?? "",
    data: [ragItem, chartItem],
  };
}

function combine(state) {
  const data = state.data ?? [];
  const hasRag = data.some((d) => d?.type === "rag_references");
  const hasChart = data.some((d) => d?.type === "bar");
  let answer = state.answer ?? "";

  if (hasRag && hasChart) {
    answer = (answer || "").trim();
    if (answer) answer += " ";
    answer += "I also generated Chart.js config.";
  } else if (hasChart && !hasRag) {
    answer = "Chart.js config generated. Use the returned config to render the bar chart.";
  }

  return { answer };
}

// --- Routing after router ---
function routeAfterRouter(state) {
  const r = state.route ?? {};
  if (r.direct) return "directAnswer";
  if (r.wantsBoth) return "parallel";
  if (r.wantRag) return "ragAgent";
  if (r.wantsChart) return "chartTool";
  return "directAnswer";
}

// --- Build and compile graph ---
function buildDelegationGraph() {
  const builder = new StateGraph(StateAnnotation)
    .addNode("router", router)
    .addNode("directAnswer", directAnswer)
    .addNode("ragAgent", ragAgent)
    .addNode("chartTool", chartTool)
    .addNode("parallel", parallel)
    .addNode("combine", combine)
    .addEdge(START, "router")
    .addConditionalEdges("router", routeAfterRouter, [
      "directAnswer",
      "ragAgent",
      "chartTool",
      "parallel",
    ])
    .addEdge("directAnswer", END)
    .addEdge("ragAgent", END)
    .addEdge("chartTool", "combine")
    .addEdge("parallel", "combine")
    .addEdge("combine", END);

  return builder.compile();
}

export { buildDelegationGraph, StateAnnotation };
