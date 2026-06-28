// Cliente do Hub (Bethel Base). Server-only: usa HUB_API_URL + HUB_API_KEY do
// ambiente. A key NUNCA vai pro client; os dropdowns passam por rotas proxy.

const HUB_TIMEOUT_MS = 10_000

function getConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.HUB_API_URL
  const apiKey = process.env.HUB_API_KEY
  if (!baseUrl || !apiKey) {
    throw new Error('Hub não configurado (defina HUB_API_URL e HUB_API_KEY no ambiente)')
  }
  return { baseUrl: baseUrl.replace(/\/+$/, ''), apiKey }
}

export interface HubResult {
  statusCode: number | null
  body: any
  error: string | null
}

/**
 * Requisição autenticada ao Hub. Não lança em erro HTTP: devolve
 * statusCode + body + error pra quem chama decidir (e logar).
 */
export async function hubFetch(path: string, init: RequestInit = {}): Promise<HubResult> {
  let cfg: { baseUrl: string; apiKey: string }
  try {
    cfg = getConfig()
  } catch (e: any) {
    return { statusCode: null, body: null, error: e?.message || 'Hub não configurado' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HUB_TIMEOUT_MS)
  try {
    const res = await fetch(`${cfg.baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
      signal: controller.signal,
    })
    const text = await res.text().catch(() => '')
    let body: any = null
    try {
      body = text ? JSON.parse(text) : null
    } catch {
      body = text
    }
    return { statusCode: res.status, body, error: null }
  } catch (e: any) {
    return {
      statusCode: null,
      body: null,
      error: e?.name === 'AbortError' ? 'Timeout' : e?.message || 'Falha de rede',
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Extrai mensagem legível dos dois shapes de erro do doc:
 *  - regra:     { "error": "mensagem" }
 *  - validação: { "error": "Validation failed", "issues": [ ... ] }
 */
export function hubErrorMessage(body: any, fallback?: string): string {
  if (body && typeof body === 'object') {
    if (body.error && Array.isArray(body.issues)) {
      const detail = body.issues
        .map((i: any) => i?.message || (Array.isArray(i?.path) ? i.path.join('.') : ''))
        .filter(Boolean)
        .join('; ')
      return detail ? `${body.error}: ${detail}` : String(body.error)
    }
    if (typeof body.error === 'string') return body.error
  }
  return fallback || 'Erro no Hub'
}

export interface Grupo {
  id: string
  nome: string
}
export interface Etapa {
  id: string
  nome: string
  ordem?: number
}

export async function getGrupos(): Promise<Grupo[]> {
  const r = await hubFetch('/api/grupos')
  if (r.error) throw new Error(r.error)
  if (r.statusCode && r.statusCode >= 400) throw new Error(hubErrorMessage(r.body, `Erro ${r.statusCode}`))
  return r.body?.data || []
}

export async function getEtapas(grupoId: string): Promise<Etapa[]> {
  const r = await hubFetch(`/api/grupos/${encodeURIComponent(grupoId)}/etapas`)
  if (r.error) throw new Error(r.error)
  if (r.statusCode && r.statusCode >= 400) throw new Error(hubErrorMessage(r.body, `Erro ${r.statusCode}`))
  return r.body?.data || []
}

/** Envia 1 lead pro Hub. dryRun adiciona ?dry_run=true (valida sem gravar). */
export async function sendLead(payload: any, opts: { dryRun?: boolean } = {}): Promise<HubResult> {
  const path = `/api/leads${opts.dryRun ? '?dry_run=true' : ''}`
  return hubFetch(path, { method: 'POST', body: JSON.stringify(payload) })
}
