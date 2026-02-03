import weaviate from "weaviate-client";

const hostStr = process.env.WEAVIATE_HOST || process.env.WEAVIATE || "localhost:8080";
const [host, port] = hostStr.includes(":")
  ? hostStr.split(":")
  : [hostStr, "8080"];

/** Weaviate client (Promise). Use: const c = await client; */
export const client = weaviate.connectToLocal({
  host: host.trim(),
  port: Number(port) || 8080,
});
