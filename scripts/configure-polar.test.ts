import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, it } from "node:test";
import { findPolarLndConfig, updateEnvFile } from "./configure-polar.js";

describe("configure-polar", () => {
  it("selects Alice and converts Polar credentials for env usage", async () => {
    const root = await mkdtemp(join(tmpdir(), "notary402-polar-"));
    try {
      const alice = join(root, "networks", "demo", "volumes", "lnd", "alice");
      const bob = join(root, "networks", "demo", "volumes", "lnd", "bob");
      await mkdir(alice, { recursive: true });
      await mkdir(bob, { recursive: true });
      await writeFile(join(alice, "admin.macaroon"), Buffer.from("alice-macaroon"));
      await writeFile(join(alice, "tls.cert"), "alice-cert");
      await writeFile(join(bob, "admin.macaroon"), Buffer.from("bob-macaroon"));
      await writeFile(join(bob, "tls.cert"), "bob-cert");
      await writeFile(join(root, "network.json"), JSON.stringify({ name: "demo", nodes: [{ name: "Alice", ports: { grpc: 11001 } }] }));

      const config = await findPolarLndConfig({ polarHome: root });

      assert.equal(config.networkName, "demo");
      assert.equal(config.nodeName, "Alice");
      assert.equal(config.grpcHost, "127.0.0.1:11001");
      assert.equal(config.macaroonHex, Buffer.from("alice-macaroon").toString("hex"));
      assert.equal(config.tlsCert, "alice-cert");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });

  it("updates .env.live without printing or removing existing values", async () => {
    const root = await mkdtemp(join(tmpdir(), "notary402-env-"));
    try {
      const envPath = join(root, ".env.live");
      await writeFile(envPath, "SUPABASE_URL=https://example.supabase.co\nAPERTURE_BASE_URL=\n");

      await updateEnvFile(envPath, {
        POLAR_NETWORK_NAME: "demo",
        LND_AGENT_GRPC_HOST: "127.0.0.1:11001",
        LND_AGENT_MACAROON: "abcdef",
        LND_AGENT_TLS_CERT: "cert",
        APERTURE_BASE_URL: "http://localhost:8080"
      });

      const updated = await readFile(envPath, "utf8");
      assert.match(updated, /^SUPABASE_URL=https:\/\/example\.supabase\.co/m);
      assert.match(updated, /^POLAR_NETWORK_NAME=demo/m);
      assert.match(updated, /^LND_AGENT_MACAROON=abcdef/m);
      assert.match(updated, /^APERTURE_BASE_URL=http:\/\/localhost:8080/m);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
