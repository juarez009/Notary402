import { requireEnv, redact } from "./env.js";

const base = requireEnv("APERTURE_BASE_URL");
const response = await fetch(base);
if (!response.ok && response.status !== 402 && response.status !== 404) throw new Error(`Aperture smoke failed with HTTP ${response.status}`);
console.log(`Aperture smoke reachable: ${redact(base)} HTTP ${response.status}`);
