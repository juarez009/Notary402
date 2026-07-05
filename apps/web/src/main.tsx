import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API = "http://localhost:3001";

function App() {
  const [id, setId] = useState("");
  const [status, setStatus] = useState<Record<string, any> | null>(null);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState("");

  async function loadStatus() {
    try {
      const response = await fetch(`${API}/v1/live/status`);
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
          {["supabase", "datamcp", "amoy_rpc", "zavu", "aperture", "n8n"].map((key) => (
            <div className="tile" key={key}>
              <span>{key}</span>
              <strong className={status?.[key]?.configured ? "ok" : "pending"}>{status?.[key]?.configured ? "configured" : "pending"}</strong>
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
