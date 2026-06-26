import crypto from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { supabaseAdmin } from '@/lib/supabase'

const DISPATCH_TIMEOUT_MS = 10_000
export const MAX_BATCH = 200
// Backoff por número da tentativa já feita (1-based). Após esgotar = morto.
const BACKOFF_MINUTES = [1, 5, 30, 120, 360]

// Objeto enviado ao receptor. Campos semânticos (nome/email/...) são mapeados
// na plataforma de destino; aqui mandamos todos os campos como campos_extras.
export interface ReceptorObject {
  event_id: string
  evento: { tipo: string; occurred_at: string | null }
  campos_extras: Record<string, any>
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

/** Monta o objeto de um lead: event_id estável + todos os campos como campos_extras. */
async function buildLeadObject(
  formId: string,
  responseId: string,
  event: string
): Promise<ReceptorObject | null> {
  const { data: response } = await supabaseAdmin
    .from('responses')
    .select('id, completed_at, response_answers(value, field_id, form_fields(title, "order"))')
    .eq('id', responseId)
    .eq('form_id', formId)
    .single()
  if (!response) return null

  const answers = ((response as any).response_answers || []).sort(
    (a: any, b: any) => (a.form_fields?.order ?? 0) - (b.form_fields?.order ?? 0)
  )

  const campos_extras: Record<string, any> = {}
  for (const a of answers) {
    const title: string | null = a.form_fields?.title ?? null
    if (!title) continue
    // Colisão de título: sufixa " (2)", " (3)"...
    let key = title
    let n = 2
    while (key in campos_extras) key = `${title} (${n++})`
    campos_extras[key] = a.value
  }

  return {
    event_id: response.id,
    evento: { tipo: event, occurred_at: (response as any).completed_at ?? null },
    campos_extras,
  }
}

// ---- Assinatura + envio -------------------------------------------------

interface PostResult {
  statusCode: number | null
  responseBody: string | null
  error: string | null
}

/**
 * Assina (HMAC-SHA256 sobre `{timestamp}.{body}`) e envia o body cru.
 * `body` deve ser a string EXATA serializada uma única vez.
 */
export async function postSigned(webhook: any, body: string): Promise<PostResult> {
  let statusCode: number | null = null
  let responseBody: string | null = null
  let error: string | null = null

  try {
    await assertUrlAllowed(webhook.url)

    if (!webhook.secret) {
      return { statusCode: null, responseBody: null, error: 'Secret não configurado' }
    }

    const timestamp = Date.now().toString()
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}.${body}`, 'utf8')
      .digest('hex')

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), DISPATCH_TIMEOUT_MS)
    try {
      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'User-Agent': 'BethelForms-Webhook/1.0',
          ...(webhook.headers && typeof webhook.headers === 'object' ? webhook.headers : {}),
          // Headers críticos por último: não podem ser sobrescritos pelos extras.
          'Content-Type': 'application/json; charset=utf-8',
          'X-Timestamp': timestamp,
          'X-Signature': `hmac-sha256=${signature}`,
        },
        body,
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

  return { statusCode, responseBody, error }
}

// ---- Classificação de retry --------------------------------------------

/** 429/5xx/rede são transitórios (reenviar). 2xx ok; 401/422/4xx não reenvia. */
function isRetryable(statusCode: number | null, error: string | null): boolean {
  if (error) return true // rede/timeout
  if (statusCode === null) return true
  if (statusCode === 429) return true
  if (statusCode >= 500) return true
  return false
}

/** Próximo retry pelo número da tentativa já feita. null = sucesso/morto/não-retryável. */
function computeNextRetry(attempt: number, retryable: boolean): string | null {
  if (!retryable) return null
  if (attempt > BACKOFF_MINUTES.length) return null // esgotado
  const min = BACKOFF_MINUTES[attempt - 1]
  return new Date(Date.now() + min * 60_000).toISOString()
}

// ---- Dispatch -----------------------------------------------------------

export interface DispatchResult {
  webhookId: string
  responseId: string
  ok: boolean
  statusCode: number | null
  error: string | null
}

/** Último attempt registrado por (webhook, response). 0 se não houver. */
async function lastAttempts(
  webhookId: string,
  responseIds: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (responseIds.length === 0) return map
  const { data: logs } = await supabaseAdmin
    .from('webhook_logs')
    .select('response_id, attempt')
    .eq('webhook_id', webhookId)
    .in('response_id', responseIds)
    .order('attempt', { ascending: false })
  for (const l of logs || []) {
    if (!map.has(l.response_id)) map.set(l.response_id, l.attempt)
  }
  return map
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

/**
 * Entrega N respostas a UM webhook. 1 resposta = objeto único; várias = array (lote).
 * Grava um webhook_log por resposta (com status item-a-item no lote).
 */
async function deliverToWebhook(
  webhook: any,
  formId: string,
  responseIds: string[],
  event: string
): Promise<DispatchResult[]> {
  const results: DispatchResult[] = []
  const attempts = await lastAttempts(webhook.id, responseIds)

  for (const part of chunk(responseIds, MAX_BATCH)) {
    // monta objetos (pula respostas vazias)
    const objs: ReceptorObject[] = []
    const meta: { responseId: string; attempt: number }[] = []
    for (const rid of part) {
      const obj = await buildLeadObject(formId, rid, event)
      if (!obj) continue
      objs.push(obj)
      meta.push({ responseId: rid, attempt: (attempts.get(rid) ?? 0) + 1 })
    }
    if (objs.length === 0) continue

    const single = objs.length === 1
    const body = JSON.stringify(single ? objs[0] : objs)
    const { statusCode, responseBody, error } = await postSigned(webhook, body)
    const httpOk = statusCode !== null && statusCode >= 200 && statusCode < 300

    // No lote, status real vem por item em data.resultados[]
    let resultados: any[] | null = null
    if (!single && httpOk && responseBody) {
      try {
        const parsed = JSON.parse(responseBody)
        if (Array.isArray(parsed?.data?.resultados)) resultados = parsed.data.resultados
      } catch {
        /* corpo não-JSON: trata pelo HTTP */
      }
    }

    const rows = meta.map((m, idx) => {
      let itemOk = httpOk
      let itemError = error
      if (resultados) {
        const r = resultados.find((x) => x?.index === idx) ?? resultados[idx]
        if (r) {
          itemOk = r.status === 'ok'
          itemError = itemOk ? null : r.error || 'erro no item'
        }
      }
      // Só falha de transporte (sem resultados) agenda retry; erro de item é validação.
      const retryable = !itemOk && !resultados && isRetryable(statusCode, error)
      results.push({
        webhookId: webhook.id,
        responseId: m.responseId,
        ok: itemOk,
        statusCode,
        error: itemError,
      })
      return {
        webhook_id: webhook.id,
        response_id: m.responseId,
        status_code: statusCode,
        request_payload: objs[idx],
        response_body: responseBody,
        error: itemError,
        attempt: m.attempt,
        next_retry_at: computeNextRetry(m.attempt, retryable),
      }
    })

    await supabaseAdmin.from('webhook_logs').insert(rows)
  }

  return results
}

/**
 * Dispara os webhooks ativos do form para UMA resposta (completion).
 * Best-effort: nunca lança, sempre grava log.
 */
export async function dispatchWebhooks(
  formId: string,
  responseId: string,
  opts: { webhookId?: string; event?: string } = {}
): Promise<DispatchResult[]> {
  return dispatchBatch(formId, [responseId], opts)
}

/**
 * Dispara os webhooks ativos do form para várias respostas (resend em lote).
 * Se webhookId for passado, dispara só aquele. Best-effort.
 */
export async function dispatchBatch(
  formId: string,
  responseIds: string[],
  opts: { webhookId?: string; event?: string } = {}
): Promise<DispatchResult[]> {
  try {
    let query = supabaseAdmin.from('webhooks').select('*').eq('form_id', formId).eq('active', true)
    if (opts.webhookId) query = query.eq('id', opts.webhookId)
    const { data: webhooks } = await query
    if (!webhooks || webhooks.length === 0) return []

    const event = opts.event || 'lead.completed'
    const results: DispatchResult[] = []
    for (const wh of webhooks) {
      results.push(...(await deliverToWebhook(wh, formId, responseIds, event)))
    }
    return results
  } catch (e) {
    console.error('[dispatchBatch] erro inesperado:', e)
    return []
  }
}

// ---- Retry (cron) -------------------------------------------------------

/**
 * Reprocessa entregas agendadas (next_retry_at vencido). Agrupa por webhook,
 * reenvia em lote, e consome os agendamentos para não repetir.
 */
export async function retryDue(limit = MAX_BATCH): Promise<{ processed: number }> {
  const nowIso = new Date().toISOString()
  const { data: due } = await supabaseAdmin
    .from('webhook_logs')
    .select('id, webhook_id, response_id, attempt, next_retry_at')
    .not('next_retry_at', 'is', null)
    .lte('next_retry_at', nowIso)
    .order('attempt', { ascending: false })
    .limit(limit * 4)
  if (!due || due.length === 0) return { processed: 0 }

  // Dedup: mantém só a maior tentativa por (webhook, response).
  const seen = new Set<string>()
  const byWebhook = new Map<string, string[]>()
  for (const d of due) {
    const key = `${d.webhook_id}:${d.response_id}`
    if (seen.has(key)) continue
    seen.add(key)
    const arr = byWebhook.get(d.webhook_id) || []
    if (arr.length < limit) arr.push(d.response_id)
    byWebhook.set(d.webhook_id, arr)
  }

  // Consome os agendamentos vencidos (evita re-pick antes do reenvio inserir log novo).
  await supabaseAdmin
    .from('webhook_logs')
    .update({ next_retry_at: null })
    .in(
      'id',
      due.map((d) => d.id)
    )

  // Reenvia por webhook ativo.
  const whIds = Array.from(byWebhook.keys())
  const { data: webhooks } = await supabaseAdmin
    .from('webhooks')
    .select('*')
    .in('id', whIds)
    .eq('active', true)
  const whMap = new Map((webhooks || []).map((w: any) => [w.id, w]))

  let processed = 0
  for (const [whId, rids] of Array.from(byWebhook.entries())) {
    const wh = whMap.get(whId)
    if (!wh) continue
    await deliverToWebhook(wh, wh.form_id, rids, 'lead.retry')
    processed += rids.length
  }
  return { processed }
}
