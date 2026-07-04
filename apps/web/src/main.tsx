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

const API_BASE_URL = import.meta.env.VITE_NOTARY402_API_BASE_URL ?? "";

function App() {
  const [attestationId, setAttestationId] = useState("");
  const [attestation, setAttestation] = useState<Attestation | null>(null);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [dataMcp, setDataMcp] = useState<DataMcpStatus | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checkRows = useMemo(() => Object.entries(verification?.checks ?? {}), [verification]);

  async function verifyAttestation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setAttestation(null);
    setVerification(null);

    try {
      const [attestationResponse, verificationResponse, dataMcpResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/v1/attestations/${encodeURIComponent(attestationId)}`),
        fetch(`${API_BASE_URL}/v1/verify`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ attestation_id: attestationId }),
        }),
        fetch(`${API_BASE_URL}/v1/integrations/datamcp`),
      ]);

      if (!attestationResponse.ok || !verificationResponse.ok) {
        throw new Error("Attestation not found or not verifiable.");
      }

      setAttestation(await attestationResponse.json() as Attestation);
      setVerification(await verificationResponse.json() as VerificationResult);
      setDataMcp(await dataMcpResponse.json() as DataMcpStatus);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="shell">
      <section className="masthead">
        <div>
          <p className="eyebrow">Notary402 verifier</p>
          <h1>Agentic legal trust audit</h1>
        </div>
        <span className="status-pill">SV MVP</span>
      </section>

      <form className="search-panel" onSubmit={verifyAttestation}>
        <label htmlFor="attestation-id">Attestation ID</label>
        <div className="search-row">
          <input
            id="attestation-id"
            value={attestationId}
            onChange={(event) => setAttestationId(event.target.value)}
            placeholder="att_..."
          />
          <button disabled={!attestationId || loading} type="submit">
            {loading ? "Checking" : "Verify"}
          </button>
        </div>
        {error ? <p className="error">{error}</p> : null}
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
          ) : (
            <p className="muted">Run a verification to see cryptographic and payment checks.</p>
          )}
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
          ) : (
            <p className="muted">Wallet and payment proofs appear here.</p>
          )}
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
          ) : (
            <p className="muted">QVAC/ElSalvadorNotaryAgent output appears here.</p>
          )}
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
          ) : (
            <p className="muted">Read-only audit context status appears after verification.</p>
          )}
        </article>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
