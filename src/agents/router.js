/**
 * Route keywords: chart-type vs RAG vs both vs direct.
 *
 * Examples:
 *   "show me a chart of sales"           -> wantsChart: true,  wantRag: false, wantsBoth: false, direct: false
 *   "what does the policy say from the docs?" -> wantsChart: false, wantRag: true,  wantsBoth: false, direct: false
 *   "plot revenue and get refund policy from database" -> wantsChart: true, wantRag: true, wantsBoth: true, direct: false
 *   "hello, what's the weather?"          -> wantsChart: false, wantRag: false, wantsBoth: false, direct: true
 */

const CHART_TERMS = ["chart", "graph", "plot", "visual"];
const RAG_TERMS = [
  "from the docs",
  "from database",
  "knowledge base",
  "weaviate",
  "refund",
  "policy",
  "reset password",
];

function includesAny(text, terms) {
  const lower = (text || "").toLowerCase();
  return terms.some((t) => lower.includes(t.toLowerCase()));
}

/**
 * @param {string} userQuery
 * @returns {Promise<{ wantsChart: boolean, wantRag: boolean, wantsBoth: boolean, direct: boolean }>}
 */
export async function decideRoute(userQuery) {
  const wantsChart = includesAny(userQuery, CHART_TERMS);
  const wantRag = includesAny(userQuery, RAG_TERMS);
  const wantsBoth = wantsChart && wantRag;
  const direct = !wantsChart && !wantRag;

  return {
    wantsChart,
    wantRag,
    wantsBoth,
    direct,
  };
}
