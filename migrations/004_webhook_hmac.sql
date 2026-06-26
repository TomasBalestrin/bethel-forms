-- ============================================
-- Migration 004: Webhook HMAC + retry
-- Adiciona secret (assinatura HMAC-SHA256 por webhook) e agendamento de retry
-- (next_retry_at) nos logs. Rodar no Supabase SQL Editor.
-- Tabelas webhooks e webhook_logs já existem (supabase-setup.sql + 003).
-- ============================================

-- Secret usado para assinar cada disparo (HMAC-SHA256). Apenas server-side.
ALTER TABLE webhooks
  ADD COLUMN IF NOT EXISTS secret TEXT;

-- Quando o disparo falha de forma retryável (429/5xx/rede), guarda o horário
-- da próxima tentativa. NULL = não reenviar (sucesso, 401/422 ou esgotado).
ALTER TABLE webhook_logs
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;

-- Index parcial para o cron varrer só o que está agendado.
CREATE INDEX IF NOT EXISTS idx_webhook_logs_retry
  ON webhook_logs (next_retry_at)
  WHERE next_retry_at IS NOT NULL;
