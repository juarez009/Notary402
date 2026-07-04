import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { loadEnvFiles, requireEnv } from "./live-env.ts";

const env = loadEnvFiles();
requireEnv(env, ["POSTGRES_URL"]);

const pool = new Pool({ connectionString: env.POSTGRES_URL });
try {
  const sql = readFileSync("docs/postgres-audit-schema.sql", "utf8");
  await pool.query(sql);
  console.log(JSON.stringify({ ok: true, migrated: "docs/postgres-audit-schema.sql" }, null, 2));
} finally {
  await pool.end();
}
