# Feature: Webhooks de leads

> 🟡 Ultimato | 2026-06-21 | v1.4.0

## Objetivo
Todo lead completo dispara POST para webhooks configurados por formulário. Logs de
todos os envios, com reenvio isolado e em massa.

## Decisões
- Vários webhooks por formulário (tabela `webhooks` já existia).
- Dispara só no lead completo (`complete` route), evento `lead.completed`.
- Sem HMAC. Auth do destino via headers customizados (ex: `Authorization: Bearer`)
  que o usuário cola no config.
- SSRF guard bloqueia IP interno/loopback (única proteção de origem restante).

## Banco (`migrations/003_webhooks.sql`)
- `webhooks` add `headers JSONB`, `name TEXT`.
- `webhook_logs` add `error TEXT`.
- Indexes: `idx_webhooks_form_id`, `idx_webhook_logs_webhook_id`, `idx_webhook_logs_response_id`.
- ⚠️ Rodar no Supabase SQL Editor (não aplicado automaticamente).

## Backend
- `src/lib/webhooks/dispatch.ts` — `buildLeadPayload`, `dispatchWebhooks`, `assertUrlAllowed` (SSRF).
- `src/app/api/public/forms/[slug]/complete/route.ts` — chama `dispatchWebhooks` após completar.
- `src/app/api/forms/[id]/webhooks/route.ts` — GET lista, POST cria.
- `.../webhooks/[webhookId]/route.ts` — PUT, DELETE.
- `.../webhooks/[webhookId]/test/route.ts` — POST teste (payload fake, não loga).
- `.../webhooks/logs/route.ts` — GET logs paginado, filtro success/failed.
- `.../webhooks/resend/route.ts` — POST resend `{responseId}` | `{responseIds[]}` | `{scope:'failed'}`, max 500/lote.

## Frontend
- `src/components/dashboard/webhooks-section.tsx` — config CRUD + painel de logs + resend isolado.
- `src/app/(dashboard)/form/[formId]/settings/page.tsx` — pluga seção Webhooks.
- `src/app/(dashboard)/form/[formId]/responses/page.tsx` — checkbox seleção + bulk resend; resend isolado no detalhe.

## Payload enviado
```json
{
  "event": "lead.completed",
  "form": { "id", "name", "slug" },
  "response": { "id", "status", "createdAt", "completedAt", "durationSeconds", "metadata" },
  "answers": [{ "fieldId", "fieldTitle", "fieldType", "value" }],
  "data": { "<título do campo>": "<valor>" }
}
```

## Notas / tradeoffs
- Dispatch é `await`ado no complete (garante log antes do serverless encerrar);
  adiciona latência da resposta do destino (timeout 10s) ao finalizar o lead.
- Sem auto-retry; retentativa é manual (reenvio). `attempt` incrementa por reenvio.
- Sem HMAC: se a URL vazar e o destino não exigir token, há risco de forja de leads.
