import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://localhost:3001";

const integrations = [
  { key: "supabase", label: "Supabase" },
  { key: "datamcp", label: "DataMCP" },
  { key: "amoy_rpc", label: "Amoy RPC" },
  { key: "zavu", label: "Zavu" },
  { key: "aperture", label: "Aperture" },
  { key: "polar_lnd", label: "Polar LND" },
  { key: "n8n", label: "n8n" }
] as const;

function integrationDetail(key: string, value: Record<string, any> | undefined) {
  if (!value) return "Esperando status de la API";
  if (key === "supabase") {
    if (value.key_format === "invalid") return "Service role key invalida; usando memoria";
    return value.schema ? `schema: ${value.schema}` : undefined;
  }
  if (key === "polar_lnd") return [value.network, value.grpc_host].filter(Boolean).join(" · ");
  if (key === "aperture") return value.base_url;
  if (key === "n8n") return value.mcp_url || value.base_url || value.webhook_url;
  if (key === "amoy_rpc") return value.url || `chain ${value.chain_id}`;
  if (key === "datamcp") return value.mcp_url || value.permission_preset;
  if (key === "zavu") return value.endpoint || value.channel;
  return undefined;
}

function App() {
  const [id, setId] = useState("");
  const [status, setStatus] = useState<Record<string, any> | null>(null);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  async function loadStatus() {
    try {
      const response = await fetch(`${API}/v1/live/status`);
      if (!response.ok) throw new Error(`status ${response.status}`);
      setStatus(await response.json());
    } catch {
      setError("No se pudo conectar con la API en http://localhost:3001. Revisa CORS/API.");
    }
  }

  async function verify() {
    setError("");
    setResult(null);
    const response = await fetch(`${API}/v1/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ attestation_id: id })
    });
    const body = await response.json();
    if (!response.ok) setError(body.message || "No encontrado");
    else setResult(body);
  }

  useEffect(() => {
    void loadStatus();
  }, []);

  return (
    <main className="shell">
      <section className="header">
        <div>
          <p className="eyebrow">Notary402</p>
          <h1>Verifier live</h1>
        </div>
        <button onClick={loadStatus}>Refresh status</button>
      </section>

      <section className="panel">
        <h2>Integraciones</h2>
        <div className="grid">
          {integrations.map(({ key, label }) => (
            <div className="tile" key={key}>
              <span>{label}</span>
              <strong className={status?.[key]?.configured ? "ok" : "pending"}>{status?.[key]?.configured ? "configured" : "pending"}</strong>
              <small>{integrationDetail(key, status?.[key])}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Buscar attestation</h2>
        <div className="row">
          <input value={id} onChange={(event) => setId(event.target.value)} placeholder="att_..." />
          <button onClick={verify}>Verificar</button>
        </div>
        {error && <p className="error">{error}</p>}
        {result && (
          <div className="result">
            <div className="copy-row">
              <strong>{result.attestation?.attestation_id}</strong>
              <button onClick={() => navigator.clipboard.writeText(result.attestation?.attestation_id || "")}>Copiar</button>
            </div>
            <pre>{JSON.stringify(result.checks, null, 2)}</pre>
            <pre>{JSON.stringify(result.attestation, null, 2)}</pre>
          </div>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
