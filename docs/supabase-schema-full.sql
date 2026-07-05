-- Function to automatically update `updated_at` column
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 1. Tables (with Foreign Keys and defaults)

create table if not exists agent_profiles (
  agent_id text primary key,
  name text,
  wallet_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists legal_intents (
  legal_intent_id text primary key,
  agent_id text not null references agent_profiles(agent_id) on delete cascade,
  jurisdiction text not null,
  input text not null,
  document_type text,
  parties jsonb not null default '[]',
  obligations jsonb not null default '[]',
  risk_flags jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists signature_requests (
  signature_request_id text primary key,
  agent_id text not null references agent_profiles(agent_id) on delete cascade,
  jurisdiction text not null,
  document_hash text not null,
  legal_intent_id text references legal_intents(legal_intent_id) on delete set null,
  requested_signature_level integer not null,
  request_hash text not null,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists wallet_proofs (
  wallet_proof_id text primary key,
  agent_id text not null references agent_profiles(agent_id) on delete cascade,
  chain_id integer not null,
  wallet_address text not null,
  message text not null,
  signature text not null,
  verified boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists payment_proofs (
  payment_proof_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id) on delete cascade,
  provider text not null,
  network text not null,
  receipt text,
  tx_hash text,
  status text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists legal_analyses (
  legal_analysis_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id) on delete cascade,
  jurisdiction text not null,
  risk_score integer not null,
  requires_human_notary boolean not null,
  summary text not null,
  checklist jsonb not null default '[]',
  risk_flags jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table if not exists attestations (
  attestation_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id) on delete cascade,
  document_hash text not null,
  request_hash text not null,
  agent_wallet text not null,
  wallet_proof_id text not null references wallet_proofs(wallet_proof_id),
  payment_proof_id text not null references payment_proofs(payment_proof_id),
  amoy_tx_hash text,
  status text not null,
  valid boolean not null,
  jurisdiction text not null,
  signature_level integer not null,
  requires_human_notary boolean not null,
  l402_payment jsonb,
  qvac_analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists human_escalations (
  human_escalation_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id) on delete cascade,
  jurisdiction text not null,
  reason text not null,
  status text not null,
  channel text not null,
  zavu_message_id text,
  provider_mode text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists document_requests (
  document_request_id text primary key,
  signature_request_id text not null references signature_requests(signature_request_id) on delete cascade,
  document_hash text not null,
  created_at timestamptz not null default now()
);


-- 2. Triggers for updated_at

create trigger handle_updated_at before update on agent_profiles for each row execute procedure update_updated_at_column();
create trigger handle_updated_at before update on legal_intents for each row execute procedure update_updated_at_column();
create trigger handle_updated_at before update on signature_requests for each row execute procedure update_updated_at_column();
create trigger handle_updated_at before update on payment_proofs for each row execute procedure update_updated_at_column();
create trigger handle_updated_at before update on attestations for each row execute procedure update_updated_at_column();
create trigger handle_updated_at before update on human_escalations for each row execute procedure update_updated_at_column();


-- 3. Indexes for performance on Foreign Keys

create index if not exists idx_legal_intents_agent_id on legal_intents(agent_id);
create index if not exists idx_signature_requests_agent_id on signature_requests(agent_id);
create index if not exists idx_signature_requests_legal_intent_id on signature_requests(legal_intent_id);
create index if not exists idx_wallet_proofs_agent_id on wallet_proofs(agent_id);
create index if not exists idx_payment_proofs_req_id on payment_proofs(signature_request_id);
create index if not exists idx_legal_analyses_req_id on legal_analyses(signature_request_id);
create index if not exists idx_attestations_req_id on attestations(signature_request_id);
create index if not exists idx_human_escalations_req_id on human_escalations(signature_request_id);
create index if not exists idx_document_requests_req_id on document_requests(signature_request_id);


-- 4. Enable RLS (Row Level Security)

alter table agent_profiles enable row level security;
alter table legal_intents enable row level security;
alter table signature_requests enable row level security;
alter table wallet_proofs enable row level security;
alter table payment_proofs enable row level security;
alter table legal_analyses enable row level security;
alter table attestations enable row level security;
alter table human_escalations enable row level security;
alter table document_requests enable row level security;


-- 5. Basic Policies
-- These policies allow the service_role full access (by default it bypasses RLS)
-- and allow authenticated users full access. You can restrict these later.

create policy "Enable full access for authenticated users" on agent_profiles for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on legal_intents for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on signature_requests for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on wallet_proofs for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on payment_proofs for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on legal_analyses for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on attestations for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on human_escalations for all to authenticated using (true) with check (true);
create policy "Enable full access for authenticated users" on document_requests for all to authenticated using (true) with check (true);
