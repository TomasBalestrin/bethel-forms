-- ============================================
-- Migration 005: Integração Hub (Bethel Base)
-- Segunda porta de saída de leads, via POST /api/leads (Bearer key).
-- A config (toggle/grupo/etapa/assinatura/tested_at) vive em
-- forms.settings.integration (JSON), então aqui só criamos a tabela de logs.
-- Rodar no Supabase SQL Editor.
-- ============================================

-- Disparos pro Hub (espelha webhook_logs). response_id é NULL em teste avulso.
CREATE TABLE IF NOT EXISTS hub_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  response_id UUID,
  is_test BOOLEAN NOT NULL DEFAULT false,
  grupo_id TEXT,
  etapa_id TEXT,
  status_code INT,
  acao TEXT,                       -- criado|atualizado|fundido|fila_revisao
  request_payload JSONB NOT NULL,
  response_body TEXT,
  error TEXT,
  event_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hub_logs_form_id ON hub_logs (form_id);
CREATE INDEX IF NOT EXISTS idx_hub_logs_response_id ON hub_logs (response_id);
