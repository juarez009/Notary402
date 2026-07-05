import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

interface VerificationResult {
  valid: boolean;
  checks: Record<string, boolean>;
}

interface Attestation {
  attestation_id: string;
  request_hash: string;
  document_hash: string;
  jurisdiction: string;
  notary_agent: string;
  requesting_agent: {
    agent_id: string;
    runtime: string;
    amoy_wallet: string;
  };
  payments: {
    l402: {
      provider: string;
      network: string;
      receipt: string;
    };
    amoy?: {
      chain_id: number;
      tx_hash: string;
    };
  };
  legal_analysis: {
    risk_score: number;
    requires_human_notary: boolean;
    summary: string;
  };
  status: string;
}

interface DataMcpStatus {
  configured: boolean;
  permission_preset: string;
  mcp_url: string | null;
}

interface LiveStatus {
  supabase: { configured: boolean; schema: string; url: string | null };
  datamcp: { configured: boolean; permission_preset: string };
  amoy_rpc: { configured: boolean; chain_id: number };
  zavu: { configured: boolean; channel: string };
  aperture: { configured: boolean; base_url: string | null };
  n8n: { configured: boolean };
}

const API_BASE_URL = import.meta.env.VITE_NOTARY402_API_BASE_URL ?? "";

function App() {
  const [activeTab, setActiveTab] = useState<"verify" | "request">("verify");
  const [attestationId, setAttestationId] = useState("");
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [dataMcp, setDataMcp] = useState<DataMcpStatus | null>(null);
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [tipoDocumento, setTipoDocumento] = useState("COMPRAVENTA");
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState("");
  const [profesion, setProfesion] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [nacionalidad, setNacionalidad] = useState("Salvadorena");
  const [dui, setDui] = useState("");
  const [nit, setNit] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [reqLoading, setReqLoading] = useState(false);

  const checkRows = useMemo(() => Object.entries(verification?.checks ?? {}), [verification]);

  async function verifyAttestation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAttestation(null);
    setVerification(null);

    try {
      const [attestationResponse, verificationResponse, dataMcpResponse, liveStatusResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/v1/attestations/${encodeURIComponent(attestationId)}`),
        fetch(`${API_BASE_URL}/v1/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ attestation_id: attestationId }),
        }),
        fetch(`${API_BASE_URL}/v1/integrations/datamcp`),
        fetch(`${API_BASE_URL}/v1/live/status`),
      ]);

      if (!attestationResponse.ok || !verificationResponse.ok) {
        throw new Error(`Attestation not found or not verifiable from ${API_BASE_URL || "same-origin API"}. Check API server and CORS.`);
      }

      setAttestation(await attestationResponse.json() as Attestation);
      setVerification(await verificationResponse.json() as VerificationResult);
      setDataMcp(await dataMcpResponse.json() as DataMcpStatus);
      if (liveStatusResponse.ok) {
        setLiveStatus(await liveStatusResponse.json() as LiveStatus);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submitDocumentRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setReqLoading(true);
    setReqMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/v1/documents/request`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tipo_documento: tipoDocumento,
          jurisdiccion: "SV",
          detalles: {},
          comparecientes: [{
            nombre_completo: nombre,
            edad: Number.parseInt(edad, 10),
            profesion,
            domicilio,
            nacionalidad,
            dui,
            nit: nit || undefined,
          }],
        }),
      });
      if (!response.ok) {
        throw new Error(`Document request failed with HTTP ${response.status}.`);
      }
      const data = await response.json() as { document_request_id: string };
      setReqMessage(`Submitted. ID: ${data.document_request_id}`);
    } catch (caught) {
      setReqMessage(caught instanceof Error ? caught.message : "Submission failed.");
    } finally {
      setReqLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="masthead">
        <div>
          <p className="eyebrow">Notary402</p>
          <h1>Agentic legal trust audit & services</h1>
        </div>
        <span className="status-pill">SV MVP</span>
      </section>

      <div className="tabs">
        <button className={activeTab === "verify" ? "secondary" : ""} onClick={() => setActiveTab("verify")} type="button">Verify Attestation</button>
        <button className={activeTab === "request" ? "secondary" : ""} onClick={() => setActiveTab("request")} type="button">Request Document (SV)</button>
      </div>

      {activeTab === "verify" ? (
        <>
          <form className="search-panel" onSubmit={verifyAttestation}>
            <label htmlFor="attestation-id">Attestation ID</label>
            <div className="search-row">
              <input id="attestation-id" value={attestationId} onChange={(event) => setAttestationId(event.target.value)} placeholder="att_..." />
              <button disabled={!attestationId || loading} type="submit">{loading ? "Checking" : "Verify"}</button>
            </div>
            {error ? <p className="error">{error}</p> : null}
            {attestation ? (
              <button className="secondary" type="button" onClick={() => navigator.clipboard.writeText(attestation.attestation_id)}>
                Copy attestation id
              </button>
            ) : null}
          </form>

          <section className="grid">
            <article className="panel">
              <h2>Checks</h2>
              {verification ? (
                <>
                  <strong className={verification.valid ? "good" : "bad"}>{verification.valid ? "Valid" : "Invalid"}</strong>
                  <dl className="check-list">
                    {checkRows.map(([name, passed]) => (
                      <div key={name}>
                        <dt>{name.replaceAll("_", " ")}</dt>
                        <dd className={passed ? "good" : "bad"}>{passed ? "pass" : "fail"}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : <p className="muted">Run verification to see cryptographic payment checks.</p>}
            </article>

            <article className="panel">
              <h2>Wallet & payment</h2>
              {attestation ? (
                <dl>
                  <dt>Agent</dt>
                  <dd>{attestation.requesting_agent.agent_id}</dd>
                  <dt>Amoy wallet</dt>
                  <dd className="mono">{attestation.requesting_agent.amoy_wallet}</dd>
                  <dt>L402</dt>
                  <dd>{attestation.payments.l402.provider} / {attestation.payments.l402.network}</dd>
                  <dt>Receipt</dt>
                  <dd className="mono">{attestation.payments.l402.receipt}</dd>
                </dl>
              ) : <p className="muted">Wallet and payment proofs appear here.</p>}
            </article>

            <article className="panel wide">
              <h2>Legal analysis</h2>
              {attestation ? (
                <div className="analysis">
                  <div>
                    <span className="metric">{attestation.legal_analysis.risk_score}</span>
                    <span className="muted">risk score</span>
                  </div>
                  <p>{attestation.legal_analysis.summary}</p>
                  <p className={attestation.legal_analysis.requires_human_notary ? "bad" : "good"}>
                    {attestation.legal_analysis.requires_human_notary ? "Human notary required" : "Agentic attestation eligible"}
                  </p>
                </div>
              ) : <p className="muted">QVAC/ElSalvadorNotaryAgent output appears here.</p>}
            </article>

            <article className="panel">
              <h2>Live status</h2>
              {liveStatus ? (
                <dl>
                  <dt>Supabase</dt>
                  <dd className={liveStatus.supabase.configured ? "good" : "bad"}>
                    {liveStatus.supabase.configured ? `configured (${liveStatus.supabase.schema})` : "missing"}
                  </dd>
                  <dt>Amoy RPC</dt>
                  <dd>{liveStatus.amoy_rpc.configured ? `chain ${liveStatus.amoy_rpc.chain_id}` : "missing"}</dd>
                  <dt>Aperture</dt>
                  <dd>{liveStatus.aperture.base_url ?? "missing"}</dd>
                  <dt>Zavu</dt>
                  <dd>{liveStatus.zavu.configured ? liveStatus.zavu.channel : "missing"}</dd>
                  <dt>n8n</dt>
                  <dd>{liveStatus.n8n.configured ? "configured" : "missing"}</dd>
                </dl>
              ) : <p className="muted">Live integration status appears after verification.</p>}
            </article>

            <article className="panel">
              <h2>DataMCP</h2>
              {dataMcp ? (
                <dl>
                  <dt>Configured</dt>
                  <dd>{dataMcp.configured ? "yes" : "no"}</dd>
                  <dt>Permissions</dt>
                  <dd>{dataMcp.permission_preset}</dd>
                  <dt>MCP URL</dt>
                  <dd className="mono">{dataMcp.mcp_url ?? "not configured"}</dd>
                </dl>
              ) : <p className="muted">Read-only MCP audit context appears here.</p>}
            </article>
          </section>
        </>
      ) : (
        <form className="search-panel" onSubmit={submitDocumentRequest}>
          <h2>Request Document (El Salvador)</h2>
          <label>Document type
            <select value={tipoDocumento} onChange={(event) => setTipoDocumento(event.target.value)}>
              <option value="COMPRAVENTA">Compraventa Inmueble</option>
              <option value="PODER_GENERAL">Poder General</option>
              <option value="AUTENTICA">Autentica Firma</option>
            </select>
          </label>
          <label>Nombre completo <input required value={nombre} onChange={(event) => setNombre(event.target.value)} /></label>
          <label>Edad <input required type="number" min={18} value={edad} onChange={(event) => setEdad(event.target.value)} /></label>
          <label>Profesion u oficio <input required value={profesion} onChange={(event) => setProfesion(event.target.value)} /></label>
          <label>Domicilio <input required value={domicilio} onChange={(event) => setDomicilio(event.target.value)} /></label>
          <label>Nacionalidad <input required value={nacionalidad} onChange={(event) => setNacionalidad(event.target.value)} /></label>
          <label>DUI (00000000-0) <input required pattern="^[0-9]{8}-[0-9]$" value={dui} onChange={(event) => setDui(event.target.value)} placeholder="00000000-0" /></label>
          <label>NIT (optional) <input value={nit} onChange={(event) => setNit(event.target.value)} /></label>
          <button type="submit" disabled={reqLoading}>{reqLoading ? "Sending" : "Submit notary request"}</button>
          {reqMessage ? <p className={reqMessage.includes("failed") || reqMessage.includes("HTTP") ? "error" : "good"}>{reqMessage}</p> : null}
        </form>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
