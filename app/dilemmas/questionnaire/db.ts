import { Pool } from "pg";
import { attachDatabasePool } from "@vercel/functions";

let pool: Pool | undefined;

export function dilemmaDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 10_000,
    });
    pool.on("error", (error) => console.error("Dilemma database connection error:", error));
    attachDatabasePool(pool);
  }
  return pool;
}
