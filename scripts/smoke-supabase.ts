import { createClient } from "@supabase/supabase-js";
import { requireEnv, redact } from "./env.js";

const url = requireEnv("SUPABASE_URL");
const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const client = createClient(url, key, { db: { schema: process.env.SUPABASE_SCHEMA || "public" }, auth: { persistSession: false, autoRefreshToken: false } });

const { error } = await client.from("attestations").select("attestation_id").limit(1);
if (error) throw new Error(`Supabase smoke failed: ${error.message}`);
console.log(`Supabase smoke ok: ${redact(url)}`);
