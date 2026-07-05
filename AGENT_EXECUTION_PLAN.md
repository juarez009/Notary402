# AGENT EXECUTION PLAN: Notary402

## Purpose

This document tells an implementation agent how to read the Notary402 documentation, convert it into work, and iterate without re-planning the product from scratch.

Do not use `STITCH_DESIGN_BRIEF.md` for implementation planning unless the user explicitly asks for UI/design work.

## Source Documents

Read these documents before coding, in this order:

1. `Notary402_PRD.md`
2. `IMPLEMENTATION_PLAN.md`
3. `ARCHITECTURE.md`
4. `API_SPEC.md`
5. `ENV_SETUP.md`
6. `INTEGRATIONS.md`
7. `LEGAL_BOUNDARIES.md`
8. `TASKS.md`
9. `DEMO_SCRIPT.md`

## Reading Goals

### 1. Product Intent

From `Notary402_PRD.md`, extract:

- The system is agent-first, not a human Web2 app.
- MVP starts with El Salvador.
- Agents use MCP/REST.
- Payments use both Aperture/Polar and Polygon Amoy.
- QVAC is real local AI provider.
- n8n is workflow orchestrator and MCP bridge.
- Zavu handles communication and human escalation.
- Legal claims must stay inside the boundaries defined in `LEGAL_BOUNDARIES.md`.

### 2. Build Order

From `IMPLEMENTATION_PLAN.md`, follow the P0 order:

1. Project skeleton.
2. Core domain models.
3. REST API.
4. MCP server.
5. QVAC integration.
6. Aperture/Polar integration.
7. Polygon Amoy integration.
8. n8n workflow.
9. Zavu integration.
10. Minimal verifier/dashboard.

Only move to P1 after P0 works end-to-end.

### 3. Architecture Constraints

From `ARCHITECTURE.md`, preserve service boundaries:

- Notary402 API owns attestations and verification.
- MCP exposes agent-facing tools.
- n8n orchestrates workflow.
- Aperture protects paid endpoints.
- Polar provides local Lightning payment.
- Amoy proves agent wallet control.
- QVAC produces legal analysis.
- Zavu handles notifications and escalation.

Do not collapse all services into one abstraction if it hides the hackathon integrations.

### 4. Contract Fidelity

From `API_SPEC.md`, implement request/response contracts as written unless a technical blocker appears.

If changes are needed:

- Update `API_SPEC.md`.
- Update affected docs.
- Keep demo compatibility.

### 5. Environment Discipline

From `ENV_SETUP.md`, create:

- `.env.example`
- local port assumptions
- setup notes in README or scripts

Never hardcode private keys, API keys, macaroons or RPC secrets.

### 6. Integration Behavior

From `INTEGRATIONS.md`, implement integrations behind narrow adapters:

```text
QvacClient
ApertureClient
AmoyWalletClient
ZavuClient
N8nWorkflowClient
```

Each adapter should expose a small interface and return normalized data to the core API.

### 7. Legal Safety

From `LEGAL_BOUNDARIES.md`, ensure:

- The system never claims to replace a licensed notary.
- `requires_human_notary` is respected.
- High-risk cases route to Zavu escalation.
- Attestations describe technical/legal workflow status, not absolute legal validity.

### 8. Task Tracking

From `TASKS.md`, work P0 first.

Each iteration should:

- Pick 1 to 3 P0 tasks.
- Implement them.
- Run the smallest meaningful verification.
- Update task status if requested.
- Report what works and what remains.

## Implementation Iteration Loop

Use this loop for every agent turn:

```text
1. Read current repo state.
2. Read relevant docs.
3. Pick the next P0 task that unblocks the demo.
4. Implement the smallest useful slice.
5. Verify with a command, request, or typecheck.
6. Document any contract change.
7. Report concise progress and next step.
```

## First Coding Iteration

Recommended first implementation slice:

1. Create Node.js/TypeScript monorepo skeleton.
2. Add shared domain schemas.
3. Add Notary402 API health endpoint.
4. Add in-memory attestation store.
5. Implement request hashing.
6. Implement `POST /v1/signature/request`.
7. Implement `GET /v1/attestations/:id`.

Do not start with UI.

## Second Coding Iteration

Add wallet proof:

1. Add Amoy wallet signature verification.
2. Implement `POST /v1/wallets/verify-signature`.
3. Bind verified wallet to `signature_request_id`.
4. Add unit test or request fixture.

## Third Coding Iteration

Add QVAC:

1. Add `QvacClient`.
2. Implement `ElSalvadorNotaryAgent`.
3. Implement `POST /v1/signature/validate`.
4. Parse QVAC JSON output defensively.
5. Add fallback error states.

## Fourth Coding Iteration

Add attestation issuance:

1. Implement `POST /v1/attestations`.
2. Include wallet proof.
3. Include legal analysis.
4. Include L402 receipt placeholder field.
5. Sign or hash final attestation.
6. Implement `POST /v1/verify`.

## Fifth Coding Iteration

Add MCP:

1. Create MCP server app.
2. Expose `notary402_start_legal_signature_flow`.
3. Expose `notary402_verify_attestation`.
4. Wire tools to REST API.
5. Test from a basic MCP client if available.

## Sixth Coding Iteration

Add n8n:

1. Create webhook-compatible endpoint.
2. Add workflow payload schema.
3. Make Notary402 API easy for n8n HTTP Request nodes.
4. Document workflow steps.

## Seventh Coding Iteration

Add Zavu:

1. Add `ZavuClient`.
2. Implement `POST /v1/zavu/escalate`.
3. Add one notification/escalation path.
4. Return message id/status.

## Eighth Coding Iteration

Add Aperture/Polar:

1. Put one Notary402 endpoint behind Aperture.
2. Confirm HTTP 402 challenge.
3. Confirm paid retry.
4. Store L402 receipt in attestation.

## Ninth Coding Iteration

Add demo UI/verifier:

1. Show attestation validity.
2. Show request hash and document hash.
3. Show Amoy wallet proof.
4. Show L402/Polar proof.
5. Show QVAC legal analysis.
6. Show Zavu escalation status.

## Definition Of Done For MVP

The MVP is done when:

- An agent-facing call can start the flow.
- A signature request is created.
- A real Amoy wallet signature is verified.
- QVAC returns legal analysis.
- An attestation is issued.
- The attestation can be verified.
- n8n can orchestrate or trigger the flow.
- Zavu notification/escalation is callable.
- Aperture/Polar is either running or documented with config and one protected endpoint.

## Decision Rules

### If Time Is Short

Prioritize:

1. API contracts.
2. Amoy wallet signatures.
3. QVAC legal analysis.
4. Attestation verification.
5. MCP tool.
6. n8n workflow.
7. Zavu notification.
8. Aperture/Polar.

### If A Third-Party Integration Blocks

Keep the adapter interface.

Return a clear status:

```json
{
  "status": "integration_pending",
  "provider": "aperture",
  "reason": "Local Polar node not available"
}
```

Do not fake success.

### If Legal Risk Is High

Always set:

```json
{
  "requires_human_notary": true,
  "status": "pending_human_review"
}
```

Then call or prepare Zavu escalation.

## Agent Output Format

When reporting progress, use:

```text
Completed:
- ...

Verified:
- ...

Changed:
- ...

Next:
- ...
```

Keep reports short.

## Files The Agent May Update

Implementation files:

- `apps/**`
- `packages/**`
- `contracts/**`
- `scripts/**`
- `.env.example`
- `README.md`

Documentation files:

- `API_SPEC.md`
- `ENV_SETUP.md`
- `TASKS.md`
- `IMPLEMENTATION_PLAN.md`

Avoid changing:

- `Notary402_PRD.md` unless product scope changes.
- `LEGAL_BOUNDARIES.md` unless legal positioning changes.
- `STITCH_DESIGN_BRIEF.md` unless UI/design is requested.

