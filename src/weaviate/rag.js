import { client } from "./client.js";

const COLLECTION_NAME = "QnA";
const BM25_LIMIT = 3;
const FALLBACK_LIMIT = 10;
const FALLBACK_TOP = 3;

/**
 * @param {{ tenantId: string, query: string }} params
 * @returns {Promise<{ answer: string, references: Array<{ fileId: string, label: string, pages: string[], formatted: string[] }>, rawHits: any[] }>}
 */
export async function ragRetrieverAndAnswer({ tenantId, query }) {
  const c = await client;
  const coll = c.collections.get(COLLECTION_NAME).withTenant(tenantId);

  let rawHits = [];

  // 1) Try BM25 over question+answer, limit 3
  try {
    const bm25Result = await coll.query.bm25(query, {
      queryProperties: ["question", "answer"],
      limit: BM25_LIMIT,
      returnProperties: ["fileId", "question", "answer", "pageNumber"],
    });
    if (bm25Result?.objects?.length > 0) {
      rawHits = bm25Result.objects;
    }
  } catch (_) {
    // BM25 failed, will use fallback
  }

  // 2) Fallback: fetchObjects limit 10, pick top 3 by substring match
  if (rawHits.length === 0) {
    const fetchResult = await coll.query.fetchObjects({
      limit: FALLBACK_LIMIT,
      returnProperties: ["fileId", "question", "answer", "pageNumber"],
    });
    const all = fetchResult?.objects ?? [];
    const q = (query || "").toLowerCase();
    const scored = all
      .map((obj) => {
        const props = obj.properties || {};
        const text = [props.question, props.answer].filter(Boolean).join(" ").toLowerCase();
        const match = text.includes(q) ? 2 : (props.question || "").toLowerCase().includes(q) ? 1 : 0;
        return { obj, match, text };
      })
      .filter((s) => s.match > 0 || s.text.length > 0)
      .sort((a, b) => b.match - a.match)
      .slice(0, FALLBACK_TOP)
      .map((s) => s.obj);
    rawHits = scored;
  }

  // 3) References: group by fileId, merge unique pages, order by appearance, label "1","2","3", formatted "1- Page 3"
  const seenFileIds = [];
  const fileIdToPages = new Map();
  for (const hit of rawHits) {
    const props = hit.properties || {};
    const fileId = props.fileId ?? "";
    const pages = Array.isArray(props.pageNumber) ? [...props.pageNumber] : [];
    if (fileId && !fileIdToPages.has(fileId)) {
      seenFileIds.push(fileId);
      fileIdToPages.set(fileId, []);
    }
    const existing = fileIdToPages.get(fileId) || [];
    for (const p of pages) {
      if (p != null && p !== "" && !existing.includes(String(p))) existing.push(String(p));
    }
    if (fileId) fileIdToPages.set(fileId, existing);
  }

  const references = seenFileIds.map((fileId, i) => {
    const pages = fileIdToPages.get(fileId) || [];
    const label = String(i + 1);
    const formatted = pages.map((p) => `${label}- Page ${p}`);
    return {
      fileId,
      label,
      pages,
      formatted,
    };
  });

  // 4) Answer: first hit answer; if more hits, add " Also relevant: " + other questions
  let answer = "";
  if (rawHits.length > 0) {
    const first = rawHits[0].properties || {};
    answer = first.answer ?? "";
    if (rawHits.length > 1) {
      const otherQuestions = rawHits
        .slice(1)
        .map((h) => (h.properties || {}).question)
        .filter(Boolean);
      if (otherQuestions.length > 0) {
        answer += " Also relevant: " + otherQuestions.join("; ");
      }
    }
  }

  return {
    answer,
    references,
    rawHits,
  };
}
