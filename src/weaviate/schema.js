import { client } from "./client.js";

const COLLECTION_NAME = "QnA";

/**
 * Creates the multi-tenant QnA collection schema.
 * Fields: fileId (string, not vectorized/indexed), question (text), answer (text), pageNumber (text[]).
 */
export async function createSchema() {
  const c = await client;
  const exists = await c.collections.exists(COLLECTION_NAME);
  if (exists) {
    await c.collections.delete(COLLECTION_NAME);
    console.log(`[schema] Collection "${COLLECTION_NAME}" deleted.`);
  }
  await c.collections.create({
    name: COLLECTION_NAME,
    multiTenancy: { enabled: true },
    vectorizer: "none",
    properties: [
      {
        name: "fileId",
        dataType: "string",
        description: "The identifier for each file.",
        indexSearchable: false,
      },
      {
        name: "question",
        dataType: "text",
        description: "The question being asked.",
      },
      {
        name: "answer",
        dataType: "text",
        description: "The answer to the question.",
      },
      {
        name: "pageNumber",
        dataType: "text[]",
        description: "The page number(s) this answer was derived from.",
      },
    ],
  });
  console.log(`[schema] Collection "${COLLECTION_NAME}" created successfully.`);
}

/**
 * Ensures a tenant exists for the collection; creates it if missing.
 * @param {string} tenantId - Tenant name (e.g. "tenant-1").
 */
export async function ensureTenant(tenantId) {
  const c = await client;
  const coll = c.collections.get(COLLECTION_NAME);
  const existing = await coll.tenants.getByName(tenantId);
  if (existing) {
    console.log(`[schema] Tenant "${tenantId}" already exists.`);
    return;
  }
  await coll.tenants.create({ name: tenantId });
  console.log(`[schema] Tenant "${tenantId}" created successfully.`);
}
