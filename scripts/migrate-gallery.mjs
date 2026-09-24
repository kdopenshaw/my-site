import { readFile } from "node:fs/promises";
import pg from "pg";

const connectionString = process.env.DATABASE_URL_UNPOOLED;
if (!connectionString) throw new Error("DATABASE_URL_UNPOOLED is required.");
if (new URL(connectionString).hostname.includes("-pooler")) {
  throw new Error("Schema migrations require an unpooled connection.");
}
const client = new pg.Client({ connectionString });
try {
  await client.connect();
  await client.query("begin");
  await client.query(await readFile(new URL("../neon/fractal-gallery.sql", import.meta.url), "utf8"));
  await client.query("commit");
  console.log("Gallery schema applied.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  await client.end();
}
