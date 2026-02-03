import { client } from "./client.js";

const COLLECTION_NAME = "QnA";

const SAMPLE_OBJECTS = [
  {
    fileId: "file-001",
    question: "What is the main topic of the document?",
    answer: "The document covers the architecture and deployment of the system.",
    pageNumber: ["1", "2"],
  },
  {
    fileId: "file-002",
    question: "How does authentication work?",
    answer: "Authentication uses API keys and optional OIDC for cloud instances.",
    pageNumber: ["3", "4"],
  },
  {
    fileId: "file-003",
    question: "What are the system requirements?",
    answer: "The system requires Node.js 20+ and supports Docker deployment.",
    pageNumber: ["5"],
  },
];

/**
 * Batch inserts 3 sample objects into the QnA collection for the given tenant.
 * @param {string} tenantId - Tenant name (e.g. "tenant-1").
 */
export async function seedData(tenantId) {
  const c = await client;
  const coll = c.collections.get(COLLECTION_NAME).withTenant(tenantId);

  const result = await coll.data.insertMany(
    SAMPLE_OBJECTS.map((obj) => ({
      properties: {
        fileId: obj.fileId,
        question: obj.question,
        answer: obj.answer,
        pageNumber: obj.pageNumber,
      },
    }))
  );

  const inserted = result.objects?.length ?? 0;
  const failed = result.hasErrors ? Object.keys(result.errors || {}).length : 0;
  console.log(`[seed] Inserted ${inserted} object(s) for tenant "${tenantId}".`);
  if (failed > 0) {
    console.warn(`[seed] ${failed} object(s) failed:`, result.errors);
  }
}
