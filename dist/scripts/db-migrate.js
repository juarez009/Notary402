import { readFile } from "node:fs/promises";
if (!process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL not set. Apply docs/postgres-audit-schema.sql in Supabase SQL Editor, or set POSTGRES_URL for an admin migration path.");
    process.exit(1);
}
const sql = await readFile("docs/postgres-audit-schema.sql", "utf8");
console.log(`Migration SQL loaded (${sql.length} bytes). Direct execution is intentionally manual in this recreated workspace.`);
console.log("Use Supabase SQL Editor or Supabase CLI to apply the schema.");
