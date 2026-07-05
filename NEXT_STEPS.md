# NEXT STEPS: Cierre MVP Notary402

Este documento lista lo restante para que Notary402 funcione correctamente como MVP live. No reemplaza `README.md`, `API_SPEC.md` ni `TASKS.md`; sirve como checklist operativo de cierre.

## Estado Actual

- API Fastify creada con endpoints principales de salud, legal intent, signature request, wallet proof, L402 receipt, Amoy verification, legal analysis, attestation, verify, Zavu escalation, DataMCP status y live status.
- Runtime de auditoria migrado a Supabase JS API mediante `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, con fallback `MemoryStore` para tests/desarrollo.
- Web verifier minimo creado en `apps/web`.
- OpenAPI publicado en `GET /openapi.json` y artifact en `docs/openapi/notary402.openapi.json`.
- Scripts smoke/live creados para config, Supabase, DataMCP, Amoy, Zavu, Aperture y E2E live.
- Documentos de Supabase schema, Aperture YAML y n8n workflow existen en `docs`.
- DataMCP queda definido como read-only para agentes; Notary402 conserva las escrituras desde backend.

## P0 Live: Pendientes Criticos

- Crear `.env.live` local con credenciales reales, sin exponer secretos en chat ni frontend:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATAMCP_MCP_URL`
  - `DATAMCP_API_KEY`
  - `AMOY_RPC_URL`
  - `APERTURE_BASE_URL`
  - `N8N_WEBHOOK_NOTARY402`
  - `ZAVU_ESCALATE_URL` o `ZAVU_BASE_URL`
- Aplicar `docs/postgres-audit-schema.sql` en Supabase SQL Editor, o usar `npm.cmd run db:migrate` solo si existe `POSTGRES_URL` admin opcional.
- Confirmar que `GET /v1/live/status` reporta integraciones configuradas y no filtra secretos completos.
- Ejecutar todos los smoke scripts live con credenciales reales.
- Importar y validar `docs/n8n/notary402-legal-signature-flow.json` en n8n.
- Levantar Aperture con `docs/aperture/notary402-aperture.yaml`.
- Validar Aperture + Polar con una ruta de pago funcional y registrar el receipt L402 en Notary402.
- Probar un flujo completo contra Supabase real: legal intent -> signature request -> wallet proof -> L402 receipt -> legal analysis -> attestation -> verify.

## P1 Tecnico: Endurecimiento Recomendado

- Convertir `apps/mcp` de placeholder documental a servidor MCP ejecutable con tools reales:
  - `notary402_start_legal_signature_flow`
  - `notary402_request_legal_signature`
  - `notary402_verify_amoy_wallet`
  - `notary402_run_el_salvador_notary_agent`
  - `notary402_escalate_to_human_notary`
  - `notary402_get_attestation_status`
  - `notary402_verify_attestation`
  - `notary402_get_datamcp_flow_plan`
- Completar `smoke:e2e-live`; actualmente debe cubrir todo el flujo REST, no solo el arranque con `legal-intent`.
- Expandir `docs/openapi/notary402.openapi.json` con schemas completos de request/response y errores.
- Agregar JSON Schema validation en rutas Fastify para evitar payloads incompletos o tipos incorrectos.
- Endurecer errores del backend para que sean accionables sin exponer detalles sensibles de Supabase, RPC, DataMCP, webhooks o service keys.
- Revisar redaccion de secretos en URLs live, especialmente RPC URLs, DataMCP URLs con query params y webhooks n8n.
- Agregar pruebas para casos negativos live-ready:
  - Supabase configurado pero tabla faltante.
  - DataMCP configurado pero sin permisos read-only.
  - Amoy RPC configurado con chain id incorrecto.
  - Aperture disponible pero receipt L402 invalido.
  - Zavu configurado con respuesta no exitosa.

## P1 Producto: Verifier y Demo

- Mejorar el web verifier para soportar flujo guiado, no solo consulta/verificacion.
- Mostrar timeline de auditoria por attestation:
  - legal intent
  - signature request
  - wallet proof
  - payment proof
  - legal analysis
  - attestation
  - human escalation, si aplica
- Agregar copy/link final verificable para `attestation_id` y `verification_url`.
- Mostrar estado claro de integraciones desde `/v1/live/status`:
  - Supabase
  - DataMCP
  - Amoy
  - Aperture
  - Zavu
  - n8n
- Preparar una demo navegable con datos reales no sensibles y mensajes de error claros cuando falte una credencial live.

## Checklist de Comandos

Ejecutar primero la verificacion local:

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run typecheck
npm.cmd run build:web
```

Luego, con `.env.live` cargado y credenciales reales:

```powershell
npm.cmd run check:live-config
npm.cmd run smoke:supabase
npm.cmd run smoke:datamcp
npm.cmd run smoke:amoy
npm.cmd run smoke:zavu
npm.cmd run smoke:aperture
npm.cmd run smoke:e2e-live
```

Servicios para prueba manual:

```powershell
npm.cmd run start:api
npm.cmd run dev:web
```

## Criterio de Aceptacion MVP

El MVP se considera funcional en modo live cuando:

- Supabase tiene el schema aplicado y Notary402 escribe/lee auditoria via Supabase JS API.
- `/v1/live/status` confirma integraciones configuradas sin exponer secretos.
- DataMCP puede consultar schema/query en modo read-only contra la misma base.
- Aperture/Polar valida el pago L402 y Notary402 registra el receipt ya validado.
- Amoy RPC responde con chain id `80002` y valida una tx real cuando se provee.
- Zavu recibe una escalacion de prueba marcada como `test=true`.
- n8n ejecuta el workflow exportado con mappings reales.
- El flujo completo funciona contra Supabase real:
  - legal intent
  - signature request
  - wallet proof
  - L402 receipt
  - legal analysis
  - attestation
  - verify
- El web verifier puede consultar una attestation real y mostrar checks, wallet, payment proof, legal analysis y estado live.

## Fuera de Alcance Para MVP

- SDK TypeScript/Python.
- Marketplace de notarizacion.
- Escrow flow.
- Legal RAG completo.
- Multiples jurisdicciones mas alla de `SV`.
- Contrato on-chain propio para registry, salvo que se decida subirlo a P0.

