create table if not exists agent_profiles (
  agent_id text primary key,
  name text,
  wallet_address text,
  created_at timestamptz not null
);

create table if not exists legal_intents (
  legal_intent_id text primary key,
  agent_id text not null,
  jurisdiction text not null,
  input text not null,
  document_type text,
  parties jsonb not null default '[]',
  obligations jsonb not null default '[]',
  risk_flags jsonb not null default '[]',
  created_at timestamptz not null
);

create table if not exists signature_requests (
  signature_request_id text primary key,
  agent_id text not null,
  jurisdiction text not null,
  document_hash text not null,
  legal_intent_id text,
  requested_signature_level integer not null,
  request_hash text not null,
  status text not null,
  created_at timestamptz not null
);

create table if not exists wallet_proofs (
  wallet_proof_id text primary key,
  agent_id text not null,
  chain_id integer not null,
  wallet_address text not null,
  message text not null,
  signature text not null,
  verified boolean not null,
  created_at timestamptz not null
);

create table if not exists payment_proofs (
  payment_proof_id text primary key,
  signature_request_id text not null,
  provider text not null,
  network text not null,
  receipt text,
  tx_hash text,
  status text not null,
  created_at timestamptz not null
);

create table if not exists legal_analyses (
  legal_analysis_id text primary key,
  signature_request_id text not null,
  jurisdiction text not null,
  risk_score integer not null,
  requires_human_notary boolean not null,
  summary text not null,
  checklist jsonb not null default '[]',
  risk_flags jsonb not null default '[]',
  created_at timestamptz not null
);

create table if not exists attestations (
  attestation_id text primary key,
  signature_request_id text not null,
  document_hash text not null,
  request_hash text not null,
  agent_wallet text not null,
  wallet_proof_id text not null,
  payment_proof_id text not null,
  amoy_tx_hash text,
  status text not null,
  valid boolean not null,
  jurisdiction text not null,
  signature_level integer not null,
  requires_human_notary boolean not null,
  l402_payment jsonb,
  qvac_analysis jsonb,
  created_at timestamptz not null
);

create table if not exists human_escalations (
  human_escalation_id text primary key,
  signature_request_id text not null,
  jurisdiction text not null,
  reason text not null,
  status text not null,
  channel text not null,
  zavu_message_id text,
  provider_mode text not null,
  created_at timestamptz not null
);

create table if not exists document_requests (
  document_request_id text primary key,
  signature_request_id text not null,
  document_hash text not null,
  created_at timestamptz not null
);
