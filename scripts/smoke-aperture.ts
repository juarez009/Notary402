import { readFileSync } from "node:fs";
import { loadEnvFiles, requireEnv, redact } from "./live-env.ts";

const env = loadEnvFiles();
requireEnv(env, ["APERTURE_BASE_URL"]);

const config = readFileSync("docs/aperture/notary402-aperture.yaml", "utf8");
for (const route of ["^/v1/signature/request$", "^/v1/attestations$"]) {
  if (!config.includes(route)) {
    throw new Error(`Aperture config is missing protected route ${route}`);
  }
}

const response = await fetch(env.APERTURE_BASE_URL!, { method: "GET" });
if (response.status >= 500) {
  throw new Error(`Aperture responded with HTTP ${response.status}`);
}

console.log(JSON.stringify({
  ok: true,
  aperture_base_url: redact(env.APERTURE_BASE_URL),
  http_status: response.status,
  protected_routes_present: true,
}, null, 2));
