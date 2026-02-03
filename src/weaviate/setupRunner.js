import "dotenv/config";
import { createSchema, ensureTenant } from "./schema.js";
import { seedData } from "./seed.js";

const tenantId = process.env.TENANT_ID;
if (!tenantId) {
  console.error("[setupRunner] TENANT_ID is required.");
  process.exit(1);
}

try {
  await createSchema();
  await ensureTenant(tenantId);
  await seedData(tenantId);
  console.log("[setupRunner] Setup completed successfully.");
  process.exit(0);
} catch (err) {
  console.error("[setupRunner] Error:", err.message ?? err);
  process.exit(1);
}
