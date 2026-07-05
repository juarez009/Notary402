import { constants, type Dirent } from "node:fs";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { redact } from "./env.js";

type PolarSearchOptions = {
  polarHome?: string;
  nodeName?: string;
};

type PolarLndConfig = {
  networkName: string;
  nodeName: string;
  grpcHost: string;
  macaroonHex: string;
  tlsCert: string;
  macaroonPath: string;
  tlsCertPath: string;
};

type EnvUpdate = Record<string, string>;

const LND_NODE_DEFAULT_PORTS: Record<string, number> = {
  alice: 10001,
  bob: 10002,
  carol: 10003,
  dave: 10004
};

const KNOWN_NODE_NAMES = new Set(Object.keys(LND_NODE_DEFAULT_PORTS));

async function exists(path: string) {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(root: string, predicate: (path: string) => boolean, depth = 12): Promise<string[]> {
  const out: string[] = [];

  async function walk(current: string, remainingDepth: number) {
    if (remainingDepth < 0) return;
    let entries: Dirent[];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        await walk(path, remainingDepth - 1);
      } else if (entry.isFile() && predicate(path)) {
        out.push(path);
      }
    }
  }

  await walk(root, depth);
  return out;
}

function defaultPolarHomes(env = process.env): string[] {
  const homes = [
    env.POLAR_HOME,
    env.APPDATA ? join(env.APPDATA, "Polar") : undefined,
    env.APPDATA ? join(env.APPDATA, "polar") : undefined,
    env.LOCALAPPDATA ? join(env.LOCALAPPDATA, "Polar") : undefined,
    env.USERPROFILE ? join(env.USERPROFILE, "AppData", "Roaming", "Polar") : undefined,
    env.USERPROFILE ? join(env.USERPROFILE, ".polar") : undefined
  ].filter(Boolean) as string[];

  return [...new Set(homes.map((home) => resolve(home)))];
}

function inferNodeName(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const known = parts.find((part) => KNOWN_NODE_NAMES.has(part.toLowerCase()));
  if (known) return known[0].toUpperCase() + known.slice(1);

  const lndIndex = parts.findIndex((part) => part.toLowerCase() === "lnd");
  if (lndIndex >= 0 && parts[lndIndex + 1]) return parts[lndIndex + 1];

  return basename(dirname(path));
}

function inferNetworkName(path: string, polarHome: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  const networksIndex = parts.findIndex((part) => part.toLowerCase() === "networks");
  if (networksIndex >= 0 && parts[networksIndex + 1]) return parts[networksIndex + 1];
  return basename(polarHome);
}

async function findNearestTlsCert(start: string, polarHome: string) {
  let current = dirname(start);
  const root = resolve(polarHome);
  while (current.startsWith(root)) {
    const candidate = join(current, "tls.cert");
    if (await exists(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

function getDeepValue(value: unknown, keyPattern: RegExp): unknown {
  if (!value || typeof value !== "object") return undefined;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (keyPattern.test(key)) return child;
    const nested = getDeepValue(child, keyPattern);
    if (nested !== undefined) return nested;
  }
  return undefined;
}

function findNodeObject(value: unknown, nodeName: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = findNodeObject(child, nodeName);
      if (found) return found;
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const name = String(record.name || record.alias || record.id || "");
  if (name.toLowerCase() === nodeName.toLowerCase()) return record;

  for (const child of Object.values(record)) {
    const found = findNodeObject(child, nodeName);
    if (found) return found;
  }
  return undefined;
}

async function inferGrpcPort(polarHome: string, nodeName: string) {
  const jsonFiles = await listFiles(polarHome, (path) => path.endsWith(".json"), 5);
  for (const file of jsonFiles) {
    try {
      const parsed = JSON.parse(await readFile(file, "utf8"));
      const node = findNodeObject(parsed, nodeName);
      const rawPort = getDeepValue(node, /^(grpc|grpcPort|grpc_port)$/i);
      const port = typeof rawPort === "number" ? rawPort : Number(rawPort);
      if (Number.isInteger(port) && port > 0) return port;
    } catch {
      // Ignore non-Polar or malformed JSON files while scanning a user directory.
    }
  }

  return LND_NODE_DEFAULT_PORTS[nodeName.toLowerCase()] || 10001;
}

async function inferNetworkNameFromPolar(polarHome: string, networkId: string) {
  const networksPath = join(polarHome, "networks", "networks.json");
  if (!(await exists(networksPath))) return null;
  try {
    const parsed = JSON.parse(await readFile(networksPath, "utf8")) as { networks?: Array<{ id?: number | string; name?: string }> };
    const network = parsed.networks?.find((item) => String(item.id) === String(networkId));
    return network?.name || null;
  } catch {
    return null;
  }
}

function isPreferredNode(candidate: { nodeName: string }, preferred: string) {
  return candidate.nodeName.toLowerCase() === preferred.toLowerCase();
}

export async function findPolarLndConfig(options: PolarSearchOptions = {}): Promise<PolarLndConfig> {
  const homes = options.polarHome ? [resolve(options.polarHome)] : defaultPolarHomes();
  const preferredNode = options.nodeName || process.env.POLAR_LND_NODE || "Alice";

  for (const home of homes) {
    if (!(await exists(home))) continue;

    const macaroons = await listFiles(home, (path) => basename(path).toLowerCase() === "admin.macaroon");
    const candidates = [];
    for (const macaroonPath of macaroons) {
      const tlsCertPath = await findNearestTlsCert(macaroonPath, home);
      if (!tlsCertPath) continue;
      candidates.push({
        macaroonPath,
        tlsCertPath,
        nodeName: inferNodeName(macaroonPath),
        networkName: inferNetworkName(macaroonPath, home)
      });
    }

    const selected = candidates.find((candidate) => isPreferredNode(candidate, preferredNode)) || candidates[0];
    if (!selected) continue;

    const grpcPort = await inferGrpcPort(home, selected.nodeName);
    const networkName = (await inferNetworkNameFromPolar(home, selected.networkName)) || selected.networkName;
    const macaroonHex = (await readFile(selected.macaroonPath)).toString("hex");
    const tlsCert = (await readFile(selected.tlsCertPath, "utf8")).trim().replace(/\r?\n/g, "\\n");

    return {
      networkName,
      nodeName: selected.nodeName,
      grpcHost: `127.0.0.1:${grpcPort}`,
      macaroonHex,
      tlsCert,
      macaroonPath: selected.macaroonPath,
      tlsCertPath: selected.tlsCertPath
    };
  }

  throw new Error(`Polar LND node not found. Set POLAR_HOME to the Polar data directory${sep}network path or POLAR_LND_NODE to the desired node name.`);
}

function parseEnv(content: string) {
  const values = new Map<string, string>();
  for (const line of content.split(/\r?\n/)) {
    const match = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/.exec(line);
    if (match) values.set(match[1], match[2]);
  }
  return values;
}

export async function updateEnvFile(path: string, updates: EnvUpdate) {
  const existing = (await exists(path)) ? await readFile(path, "utf8") : "";
  const current = parseEnv(existing);
  const next = new Map(current);

  for (const [key, value] of Object.entries(updates)) {
    if (key === "APERTURE_BASE_URL" && current.get(key)?.trim()) continue;
    next.set(key, value);
  }

  const seen = new Set<string>();
  const lines = existing
    .split(/\r?\n/)
    .filter((line) => line.length > 0)
    .map((line) => {
      const match = /^([A-Za-z_][A-Za-z0-9_]*)=/.exec(line);
      if (!match || !next.has(match[1])) return line;
      seen.add(match[1]);
      return `${match[1]}=${next.get(match[1])}`;
    });

  for (const [key, value] of next.entries()) {
    if (!seen.has(key) && updates[key] !== undefined) lines.push(`${key}=${value}`);
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${lines.join("\n")}\n`);
}

function secretSummary(value: string) {
  return `${value.length} chars (${redact(value)})`;
}

export async function main() {
  const envPath = resolve(process.cwd(), ".env.live");
  const config = await findPolarLndConfig({
    polarHome: process.env.POLAR_HOME,
    nodeName: process.env.POLAR_LND_NODE
  });

  await updateEnvFile(envPath, {
    POLAR_NETWORK_NAME: config.networkName,
    LND_AGENT_GRPC_HOST: config.grpcHost,
    LND_AGENT_MACAROON: config.macaroonHex,
    LND_AGENT_TLS_CERT: config.tlsCert,
    APERTURE_BASE_URL: "http://localhost:8080"
  });

  console.log("Polar/LND configuration updated:");
  console.log(`- env_file=${envPath}`);
  console.log(`- network=${config.networkName}`);
  console.log(`- node=${config.nodeName}`);
  console.log(`- LND_AGENT_GRPC_HOST=${config.grpcHost}`);
  console.log(`- LND_AGENT_MACAROON=${secretSummary(config.macaroonHex)}`);
  console.log(`- LND_AGENT_TLS_CERT=${secretSummary(config.tlsCert)}`);
  console.log(`- APERTURE_BASE_URL=${redact("http://localhost:8080")}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
