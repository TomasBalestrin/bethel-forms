-- ============================================
-- Migration 003: Webhooks de leads
-- Adiciona headers customizados (auth do destino), coluna de erro nos logs
-- e indexes para dispatch/logs/resend.
-- Tabelas webhooks e webhook_logs já existem (supabase-setup.sql).
-- ============================================

-- Headers customizados enviados em cada disparo (ex: {"Authorization": "Bearer xxx"})
ALTER TABLE webhooks
  ADD COLUMN IF NOT EXISTS headers JSONB NOT NULL DEFAULT '{}';

-- Nome opcional para identificar o webhook na UI
ALTER TABLE webhooks
  ADD COLUMN IF NOT EXISTS name TEXT;

-- Mensagem de erro quando o disparo falha por rede/timeout (status_code fica null)
ALTER TABLE webhook_logs
  ADD COLUMN IF NOT EXISTS error TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_form_id ON webhooks(form_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_id ON webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_response_id ON webhook_logs(response_id);
