import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { loadEnvFiles } from "./live-env.ts";

const env = loadEnvFiles();
if (!env.POSTGRES_URL) {
  throw new Error("POSTGRES_URL is optional runtime-wise but required for automated SQL migrations. For Supabase JS API runtime, apply docs/postgres-audit-schema.sql in the Supabase SQL Editor or set POSTGRES_URL to a Supabase direct/pooler connection string for this admin script.");
}

const pool = new Pool({ connectionString: env.POSTGRES_URL });
try {
  const sql = readFileSync("docs/postgres-audit-schema.sql", "utf8");
  await pool.query(sql);
  console.log(JSON.stringify({ ok: true, migrated: "docs/postgres-audit-schema.sql" }, null, 2));
} finally {
  await pool.end();
}
