import { existsSync, readFileSync } from "node:fs";

export function loadEnvFiles(files = [".env", ".env.live"]): NodeJS.ProcessEnv {
  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }
    const content = readFileSync(file, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }
      const [key, ...valueParts] = line.split("=");
      const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
  return process.env;
}

export function requireEnv(env: NodeJS.ProcessEnv, keys: string[]) {
  const missing = keys.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing live configuration: ${missing.join(", ")}`);
  }
}

export function redact(value: string | undefined): string {
  if (!value) {
    return "missing";
  }
  try {
    const url = new URL(value);
    if (url.username || url.password) {
      url.username = "***";
      url.password = "***";
    }
    for (const key of [...url.searchParams.keys()]) {
      url.searchParams.set(key, "***");
    }
    return url.toString();
  } catch {
    return value.length <= 8 ? "***" : `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
}
