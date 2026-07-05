# GOOGLE STITCH DESIGN BRIEF: Notary402 Screens

## Product

Notary402 is a Web3 + full agentic AI legal trust layer. Autonomous AI agents request legal signatures through MCP/REST, pay through L402, sign with Polygon Amoy wallets, run local legal analysis with QVAC, and receive jurisdiction-aware attestations.

## Design Goal

Create a polished hackathon demo interface that makes an invisible agent-to-agent protocol easy to understand in 30 seconds.

The UI should not feel like a marketing landing page. It should feel like an operational control room for agentic legal infrastructure.

## Visual Direction

- Professional, technical, trustworthy.
- Dense but readable.
- Legal/compliance tone without looking old-fashioned.
- Web3 signals should be subtle: wallet address, tx hash, payment proof, not loud crypto visuals.
- Avoid giant hero sections.
- Avoid decorative gradient blobs.
- Use cards only for individual records or panels.
- Prefer dark-on-light or restrained neutral UI with accent colors for status.

## Primary Screens

### 1. Agent Workflow Console

Purpose:

Show the full Notary402 flow moving across systems.

Content:

- Left rail: agents involved.
  - Claude Code Agent
  - Hermes Legal Intent Agent
  - QVAC ElSalvadorNotaryAgent
  - Zavu Escalation Agent
  - Verifier Agent
- Main timeline:
  - MCP request received
  - L402 challenge issued
  - Polar payment confirmed
  - Amoy wallet verified
  - QVAC legal analysis complete
  - Zavu notification sent
  - Attestation issued
- Right panel:
  - Current attestation summary
  - Risk score
  - Signature level
  - Jurisdiction: El Salvador

### 2. Legal Signature Request Detail

Purpose:

Show one request in depth.

Content:

- Request ID.
- Document hash.
- Request hash.
- Agent ID.
- Wallet address.
- Jurisdiction.
- Requested signature level.
- Legal analysis summary.
- Human notary required: yes/no.
- Actions:
  - Verify attestation
  - Escalate through Zavu
  - View Amoy tx
  - View L402 receipt

### 3. Payment & Wallet Proof Screen

Purpose:

Show that payments and wallets are real.

Sections:

- L402 / Aperture:
  - status
  - invoice id
  - Polar node
  - paid timestamp
- Polygon Amoy:
  - wallet address
  - chain id 80002
  - signature verified
  - tx hash
- Agent budget policy:
  - max per request
  - daily limit
  - services allowed

### 4. El Salvador Notary Agent Analysis

Purpose:

Show the jurisdiction-specialized AI output.

Content:

- Agent: `ElSalvadorNotaryAgent`.
- AI provider: QVAC local.
- Document type.
- Signature level recommendation.
- Legal checklist.
- Risk flags.
- Escalation decision.
- Structured JSON preview.

### 5. Attestation Verifier

Purpose:

Public verification page.

Content:

- Big status: Valid / Invalid / Pending Human Review.
- Attestation ID.
- Document hash.
- Agent wallet.
- L402 proof.
- Amoy proof.
- Notary402 signature.
- Legal analysis hash.
- Download JSON button.

### 6. Human Escalation Queue

Purpose:

Show Zavu integration.

Content:

- Pending reviews.
- Channel used: WhatsApp/SMS/Email.
- Human notary contact.
- Reason for escalation.
- Message status.
- Callback received: yes/no.

## Components

- Status timeline.
- Agent identity chip.
- Wallet address compact display.
- Hash display with copy button.
- Verification checklist.
- Risk meter.
- Signature level badge.
- Jurisdiction badge.
- Payment proof panel.
- JSON preview panel.

## Sample Copy

Primary title:

```text
Notary402 Operations Console
```

Subtitle:

```text
Agentic legal signatures with L402 payments, Amoy wallets and jurisdiction-aware AI.
```

Verifier status:

```text
Legal Signature Attestation Valid
```

Risk summary:

```text
Eligible for agentic attestation. Human notary countersignature not required for this demo scenario.
```

Escalation summary:

```text
Zavu notified the assigned human notary via WhatsApp.
```

## Layout Notes

- Desktop-first for hackathon demo.
- Must work at 1440px wide.
- Mobile is secondary but should not break.
- Use monospace for hashes and addresses.
- Use compact tables for proofs.
- Use timeline animation sparingly.

## Color Guidance

- Base: neutral light or near-white.
- Text: charcoal.
- Success: green.
- Warning: amber.
- Error: red.
- Accent: blue or teal.
- Avoid purple-heavy, crypto-neon, or one-color palettes.

## Stitch Prompt

Use this prompt in Google Stitch:

```text
Design a desktop operational dashboard for Notary402, a Web3 and agentic AI legal trust protocol for Latin America. The UI should feel like a serious legal/compliance control room, not a marketing landing page. Show autonomous AI agents requesting legal signatures through MCP, paying with L402 through Aperture and Polar Lightning, proving identity with Polygon Amoy wallets, running local legal analysis with QVAC, and escalating through Zavu when human notary review is needed.

Create screens for: Agent Workflow Console, Legal Signature Request Detail, Payment and Wallet Proof, El Salvador Notary Agent Analysis, Attestation Verifier, and Human Escalation Queue. Use compact panels, timelines, verification checklists, wallet/hash displays, risk score, signature level badges, and jurisdiction badges. Keep the design professional, dense, readable, and trustworthy. Avoid a landing page, hero section, decorative blobs, or loud crypto styling.
```

