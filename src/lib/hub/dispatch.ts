import { supabaseAdmin } from '@/lib/supabase'
import { sendLead, hubErrorMessage } from './client'
import { buildHubPayload, buildTestPayload, AnswerWithField, HubConfig } from './payload'
import { computeFieldsSignature, SignatureField } from './signature'

export const HUB_MAX_BATCH = 200

export interface HubIntegration {
  enabled?: boolean
  grupo_id?: string | null
  grupo_nome?: string | null
  etapa_id?: string | null
  etapa_nome?: string | null
  fields_signature?: string | null
  tested_at?: string | null
}

export interface HubDispatchResult {
  responseId: string | null
  ok: boolean
  statusCode: number | null
  acao: string | null
  error: string | null
  skipped?: string
}

function isOk(statusCode: number | null): boolean {
  return statusCode !== null && statusCode >= 200 && statusCode < 300
}

function acaoFrom(body: any): string | null {
  return body?.data?.acao ?? null
}

function bodyToText(body: any): string | null {
  if (body === null || body === undefined) return null
  const s = typeof body === 'string' ? body : JSON.stringify(body)
  return s.slice(0, 2000)
}

// Carrega form com settings + campos (mínimo necessário).
async function loadForm(formId: string): Promise<any> {
  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id, settings, form_fields(id, type, title, "order")')
    .eq('id', formId)
    .single()
  return form
}

function integrationOf(form: any): HubIntegration {
  return (form?.settings?.integration || {}) as HubIntegration
}

function fieldsOf(form: any): SignatureField[] {
  return (form?.form_fields || []).map((f: any) => ({ id: f.id, type: f.type, title: f.title }))
}

// Apto a enviar? ligada + grupo + testada + assinatura do schema bate.
export function checkArmed(
  integration: HubIntegration,
  fields: SignatureField[]
): { armed: boolean; reason?: string } {
  if (!integration?.enabled) return { armed: false, reason: 'desativada' }
  if (!integration.grupo_id) return { armed: false, reason: 'sem grupo' }
  if (!integration.tested_at || !integration.fields_signature) return { armed: false, reason: 'nao testada' }
  if (computeFieldsSignature(fields) !== integration.fields_signature) return { armed: false, reason: 'schema mudou' }
  return { armed: true }
}

// Estado de prontidão (usado pelas rotas pra dar mensagem clara antes de enviar).
export async function hubReadiness(formId: string): Promise<{ armed: boolean; reason?: string }> {
  const form = await loadForm(formId)
  return checkArmed(integrationOf(form), fieldsOf(form))
}

async function insertLog(row: any): Promise<void> {
  try {
    await supabaseAdmin.from('hub_logs').insert(row)
  } catch (e) {
    console.error('[hub] erro ao gravar log:', e)
  }
}

// Resposta + answers ordenados por order do campo.
async function loadAnswers(
  formId: string,
  responseId: string
): Promise<{ answers: AnswerWithField[]; completedAt: string | null } | null> {
  const { data: response } = await supabaseAdmin
    .from('responses')
    .select('id, completed_at, response_answers(value, form_fields(type, title, "order"))')
    .eq('id', responseId)
    .eq('form_id', formId)
    .single()
  if (!response) return null

  const raw = ((response as any).response_answers || []).sort(
    (a: any, b: any) => (a.form_fields?.order ?? 0) - (b.form_fields?.order ?? 0)
  )
  const answers: AnswerWithField[] = raw.map((a: any) => ({
    value: a.value,
    field: a.form_fields ? { type: a.form_fields.type, title: a.form_fields.title } : null,
  }))
  return { answers, completedAt: (response as any).completed_at ?? null }
}

/**
 * Dispara UMA resposta pro Hub (envio real). Best-effort: nunca lança.
 * Aplica o gate (não envia se a integração não estiver "armada").
 */
export async function dispatchHub(
  formId: string,
  responseId: string,
  opts: { event?: string; form?: any } = {}
): Promise<HubDispatchResult> {
  try {
    const form = opts.form || (await loadForm(formId))
    const integration = integrationOf(form)
    const armed = checkArmed(integration, fieldsOf(form))
    if (!armed.armed) {
      return { responseId, ok: false, statusCode: null, acao: null, error: null, skipped: armed.reason }
    }

    const loaded = await loadAnswers(formId, responseId)
    if (!loaded) {
      return { responseId, ok: false, statusCode: null, acao: null, error: 'Resposta não encontrada' }
    }

    const config: HubConfig = { grupo_id: integration.grupo_id!, etapa_id: integration.etapa_id ?? null }
    const payload = buildHubPayload(loaded.answers, config, {
      event_id: responseId,
      tipo: opts.event || 'lead.completed',
      occurred_at: loaded.completedAt,
    })

    const r = await sendLead(payload)
    const ok = isOk(r.statusCode)
    const error = ok ? null : r.error || hubErrorMessage(r.body, r.statusCode ? `Erro ${r.statusCode}` : 'Falha')

    await insertLog({
      form_id: formId,
      response_id: responseId,
      is_test: false,
      grupo_id: config.grupo_id,
      etapa_id: config.etapa_id,
      status_code: r.statusCode,
      acao: acaoFrom(r.body),
      request_payload: payload,
      response_body: bodyToText(r.body),
      error,
      event_id: responseId,
    })

    return { responseId, ok, statusCode: r.statusCode, acao: acaoFrom(r.body), error }
  } catch (e: any) {
    console.error('[dispatchHub] erro inesperado:', e)
    return { responseId, ok: false, statusCode: null, acao: null, error: e?.message || 'Erro' }
  }
}

/** Reenvio em lote (1 envio por resposta; event_id = response.id => idempotente). */
export async function dispatchHubBatch(
  formId: string,
  responseIds: string[],
  opts: { event?: string } = {}
): Promise<HubDispatchResult[]> {
  const form = await loadForm(formId)
  const results: HubDispatchResult[] = []
  for (const rid of responseIds) {
    results.push(await dispatchHub(formId, rid, { event: opts.event, form }))
  }
  return results
}

/**
 * Envio de TESTE real: as perguntas do form com dados fictícios. Em 2xx, "arma"
 * a integração (grava assinatura do schema atual + tested_at), liberando o envio
 * automático no completion.
 */
export async function sendTest(
  formId: string
): Promise<{ ok: boolean; statusCode: number | null; acao: string | null; error: string | null }> {
  const form = await loadForm(formId)
  if (!form) return { ok: false, statusCode: null, acao: null, error: 'Formulário não encontrado' }

  const integration = integrationOf(form)
  if (!integration.grupo_id) {
    return { ok: false, statusCode: null, acao: null, error: 'Selecione um grupo antes de testar' }
  }

  const fields = fieldsOf(form)
  const config: HubConfig = { grupo_id: integration.grupo_id, etapa_id: integration.etapa_id ?? null }
  const eventId = `teste-${formId}-${Date.now()}`
  const payload = buildTestPayload(fields, config, eventId)

  const r = await sendLead(payload)
  const ok = isOk(r.statusCode)
  const error = ok ? null : r.error || hubErrorMessage(r.body, r.statusCode ? `Erro ${r.statusCode}` : 'Falha')

  await insertLog({
    form_id: formId,
    response_id: null,
    is_test: true,
    grupo_id: config.grupo_id,
    etapa_id: config.etapa_id,
    status_code: r.statusCode,
    acao: acaoFrom(r.body),
    request_payload: payload,
    response_body: bodyToText(r.body),
    error,
    event_id: eventId,
  })

  // Sucesso => arma a integração (assinatura atual + tested_at).
  if (ok) {
    const nextIntegration: HubIntegration = {
      ...integration,
      fields_signature: computeFieldsSignature(fields),
      tested_at: new Date().toISOString(),
    }
    await supabaseAdmin
      .from('forms')
      .update({ settings: { ...(form.settings || {}), integration: nextIntegration } })
      .eq('id', formId)
  }

  return { ok, statusCode: r.statusCode, acao: acaoFrom(r.body), error }
}
