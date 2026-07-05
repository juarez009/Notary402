# LEGAL BOUNDARIES: Notary402

## Positioning

Notary402 is a legal workflow, signature and attestation infrastructure for AI agents. It does not claim to replace licensed notaries, courts, registries or legally required human professionals.

## Core Rule

The AI agent can prepare, classify, validate, route, sign cryptographically and attest technical facts. It cannot independently create legal finality where local law requires human notarial intervention.

## Signature Levels

```text
Level 0: Hash Attestation
Technical proof of existence and integrity.

Level 1: Agent Signature
Cryptographic signature by an AI agent wallet.

Level 2: Authorized Representative Signature
Agent signs under delegated authority from a person/company.

Level 3: Jurisdiction-Compliant E-Signature
Signature process meets country-specific electronic signature rules.

Level 4: Human Notary Countersignature
Licensed notary reviews/countersigns where required.

Level 5: Public Instrument Workflow
Preparation and routing for formal public instrument workflows.
```

## ElSalvadorNotaryAgent Boundaries

The agent may:

- Classify document type.
- Produce checklist.
- Identify likely legal risk.
- Recommend signature level.
- Determine whether human escalation is needed.
- Generate structured legal analysis.

The agent may not:

- Claim final legal validity without required human review.
- Pretend to be a licensed notary.
- Issue public instruments.
- Bypass identity, consent or authority requirements.

## Required Disclaimer For Demo

> Notary402 demonstrates jurisdiction-aware legal workflow automation and cryptographic attestations. When local law requires a licensed notary or human legal professional, the system escalates rather than replacing that role.

## Human Escalation Triggers

- Public instrument required.
- Real estate transfer.
- Corporate authority ambiguity.
- Identity mismatch.
- High risk score.
- Missing party authorization.
- Document type not supported by MVP.
- Any case marked `requires_human_notary = true`.

## DataMCP Boundary

DataMCP may expose audit database context to agents through MCP, but it must not become a path for bypassing Notary402 legal workflow controls.

Allowed:

- Read-only inspection of audit records.
- Schema discovery for agents and n8n.
- Querying non-sensitive demo rows during local presentations.
- Reviewing DataMCP activity logs for auditability.

Not allowed:

- Mutating legal workflow state through DataMCP during MVP.
- Exposing human escalation or legal analysis records to external agents without custom per-table permissions.
- Treating database rows as final legal validity without Notary402 attestation verification.
