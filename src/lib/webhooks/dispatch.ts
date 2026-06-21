import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { supabaseAdmin } from '@/lib/supabase'

const DISPATCH_TIMEOUT_MS = 10_000

export interface LeadPayload {
  event: string
  form: { id: string; name: string; slug: string }
  response: {
    id: string
    status: string
    createdAt: string | null
    completedAt: string | null
    durationSeconds: number | null
    metadata: Record<string, any>
  }
  answers: Array<{
    fieldId: string | null
    fieldTitle: string | null
    fieldType: string | null
    value: any
  }>
  // Mapa plano título->valor, conveniência para o destino
  data: Record<string, any>
}

// ---- SSRF guard ---------------------------------------------------------

function isPrivateIp(ip: string): boolean {
  if (ip === '0.0.0.0' || ip === '::' || ip === '::1') return true
  if (ip.startsWith('127.') || ip.startsWith('10.') || ip.startsWith('169.254.')) return true
  if (ip.startsWith('192.168.')) return true
  // 172.16.0.0 – 172.31.255.255
  const m = ip.match(/^172\.(\d+)\./)
  if (m) {
    const o = parseInt(m[1], 10)
    if (o >= 16 && o <= 31) return true
  }
  // IPv6 unique-local / link-local
  const low = ip.toLowerCase()
  if (low.startsWith('fc') || low.startsWith('fd') || low.startsWith('fe80')) return true
  return false
}

/** Bloqueia URLs internas/loopback (SSRF). Resolve DNS best-effort. */
export async function assertUrlAllowed(raw: string): Promise<void> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error('URL inválida')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Protocolo não permitido (use http/https)')
  }
  const host = url.hostname.toLowerCase()
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) {
    throw new Error('Host interno bloqueado')
  }
  // Se já é IP literal, valida direto
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error('IP interno bloqueado')
    return
  }
  // Resolve e checa o IP de destino (best-effort)
  try {
    const { address } = await lookup(host)
    if (address && isPrivateIp(address)) throw new Error('Host resolve para IP interno')
  } catch (e: any) {
    if (e?.message?.includes('interno')) throw e
    // falha de DNS: deixa o fetch falhar naturalmente
  }
}

// ---- Payload ------------------------------------------------------------

export async function buildLeadPayload(
  formId: string,
  responseId: string,
  event = 'lead.completed'
): Promise<LeadPayload | null> {
  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id, name, slug')
    .eq('id', formId)
    .single()
  if (!form) return null

  const { data: response } = await supabaseAdmin
    .from('responses')
    .select('*, response_answers(*, form_fields(id, type, title, "order"))')
    .eq('id', responseId)
    .eq('form_id', formId)
    .single()
  if (!response) return null

  const answers = ((response as any).response_answers || [])
    .sort((a: any, b: any) => (a.form_fields?.order ?? 0) - (b.form_fields?.order ?? 0))
    .map((a: any) => ({
      fieldId: a.field_id,
      fieldTitle: a.form_fields?.title ?? null,
      fieldType: a.form_fields?.type ?? null,
      value: a.value,
    }))

  const data: Record<string, any> = {}
  for (const a of answers) {
    if (a.fieldTitle) data[a.fieldTitle] = a.value
  }

  return {
    event,
    form: { id: form.id, name: form.name, slug: form.slug },
    response: {
      id: response.id,
      status: response.status,
      createdAt: response.created_at,
      completedAt: response.completed_at,
      durationSeconds: response.duration_seconds,
      metadata: response.metadata || {},
    },
    answers,
    data,
  }
}

// ---- Dispatch -----------------------------------------------------------

interface DispatchResult {
  webhookId: string
  ok: boolean
  statusCode: number | null
  error: string | null
}

async function deliver(
  webhook: any,
  payload: LeadPayload,
  attempt: number
): Promise<DispatchResult> {
  let statusCode: number | null = null
  let responseBody: string | null = null
  let error: string | null = null

  try {
    await assertUrlAllowed(webhook.url)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT_MS)
    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'BethelForms-Webhook/1.0',
          ...(webhook.headers && typeof webhook.headers === 'object' ? webhook.headers : {}),
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
      statusCode = res.status
      responseBody = (await res.text().catch(() => '')).slice(0, 2000)
    } finally {
      clearTimeout(timer)
    }
  } catch (e: any) {
    error = e?.name === 'AbortError' ? 'Timeout' : e?.message || 'Falha de rede'
  }

  const ok = statusCode !== null && statusCode >= 200 && statusCode < 300

  await supabaseAdmin.from('webhook_logs').insert({
    webhook_id: webhook.id,
    response_id: payload.response.id,
    status_code: statusCode,
    request_payload: payload,
    response_body: responseBody,
    error,
    attempt,
  })

  return { webhookId: webhook.id, ok, statusCode, error }
}

/**
 * Dispara todos os webhooks ativos do form para a resposta.
 * Se webhookId for passado, dispara só aquele (resend isolado).
 * Best-effort: nunca lança, sempre grava log.
 */
export async function dispatchWebhooks(
  formId: string,
  responseId: string,
  opts: { webhookId?: string; event?: string } = {}
): Promise<DispatchResult[]> {
  try {
    let query = supabaseAdmin.from('webhooks').select('*').eq('form_id', formId).eq('active', true)
    if (opts.webhookId) query = query.eq('id', opts.webhookId)
    const { data: webhooks } = await query
    if (!webhooks || webhooks.length === 0) return []

    const payload = await buildLeadPayload(formId, responseId, opts.event)
    if (!payload) return []

    // Próxima tentativa por webhook (resend incrementa attempt)
    const results: DispatchResult[] = []
    for (const wh of webhooks) {
      const { data: last } = await supabaseAdmin
        .from('webhook_logs')
        .select('attempt')
        .eq('webhook_id', wh.id)
        .eq('response_id', responseId)
        .order('attempt', { ascending: false })
        .limit(1)
        .maybeSingle()
      const attempt = (last?.attempt ?? 0) + 1
      results.push(await deliver(wh, payload, attempt))
    }
    return results
  } catch (e) {
    console.error('[dispatchWebhooks] erro inesperado:', e)
    return []
  }
}
