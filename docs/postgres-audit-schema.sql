create table if not exists agent_profiles (
  agent_id text primary key,
  runtime text not null,
  amoy_wallet text,
  created_at timestamptz not null default now()
);

create table if not exists legal_intents (
  legal_intent_id text primary key,
  agent_id text not null references agent_profiles(agent_id),
  jurisdiction text not null,
  input text not null,
  document_type text,
  parties jsonb not null default '[]'::jsonb,
  obligations jsonb not null default '[]'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists signature_requests (
  signature_request_id text primary key,
  agent_id text not null,
  jurisdiction text not null,
  document_hash text not null,
  request_hash text not null unique,
  legal_intent_id text references legal_intents(legal_intent_id),
  requested_signature_level integer not null check (requested_signature_level between 0 and 5),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists wallet_proofs (
  wallet_proof_id text primary key,
  signature_request_id text references signature_requests(signature_request_id),
  agent_id text not null,
  chain_id integer not null,
  wallet_address text not null,
  message text not null,
  signature text not null,
  valid boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists payment_proofs (
  payment_proof_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id),
  provider text not null,
  network text not null,
  receipt text not null,
  tx_hash text,
  valid boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists legal_analyses (
  legal_analysis_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id),
  notary_agent text not null,
  signature_level integer not null check (signature_level between 0 and 5),
  risk_score numeric not null check (risk_score >= 0 and risk_score <= 1),
  requires_human_notary boolean not null,
  summary text not null,
  checklist jsonb not null default '[]'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists attestations (
  attestation_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id),
  request_hash text not null,
  document_hash text not null,
  jurisdiction text not null,
  notary_agent text not null,
  requesting_agent jsonb not null,
  payments jsonb not null,
  signature jsonb not null,
  legal_analysis jsonb not null,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists human_escalations (
  escalation_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id),
  jurisdiction text not null,
  reason text not null,
  channel text not null,
  zavu_message_id text,
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_signature_requests_agent_id on signature_requests(agent_id);
create index if not exists idx_signature_requests_request_hash on signature_requests(request_hash);
create index if not exists idx_legal_analyses_signature_request_id on legal_analyses(signature_request_id);
create index if not exists idx_attestations_signature_request_id on attestations(signature_request_id);
create index if not exists idx_human_escalations_signature_request_id on human_escalations(signature_request_id);
