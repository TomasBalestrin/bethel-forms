import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { dispatchBatch, MAX_BATCH } from '@/lib/webhooks/dispatch'

export const dynamic = 'force-dynamic'

/**
 * Reenvia webhooks.
 * Body: { responseId } | { responseIds: [] } | { scope: 'failed' }
 * Opcional: { webhookId } para reenviar só um webhook.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!form) return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  let responseIds: string[] = []

  if (body.responseId) {
    responseIds = [body.responseId]
  } else if (Array.isArray(body.responseIds)) {
    responseIds = body.responseIds.filter((x: any) => typeof x === 'string')
  } else if (body.scope === 'failed') {
    responseIds = await resolveFailedResponseIds(params.id)
  } else {
    return NextResponse.json({ error: 'Informe responseId, responseIds ou scope' }, { status: 400 })
  }

  if (responseIds.length === 0)
    return NextResponse.json({ error: 'Nenhuma resposta para reenviar' }, { status: 400 })
  if (responseIds.length > MAX_BATCH)
    return NextResponse.json({ error: `Máximo de ${MAX_BATCH} por lote` }, { status: 400 })

  // Garante que as respostas pertencem ao form
  const { data: valid } = await supabaseAdmin
    .from('responses')
    .select('id')
    .eq('form_id', params.id)
    .in('id', responseIds)
  const validIds = new Set((valid || []).map((r: any) => r.id))
  const ids = responseIds.filter((rid) => validIds.has(rid))

  // Envio em lote (array <=200) por webhook, mesmo event_id = idempotente.
  const results = await dispatchBatch(params.id, ids, {
    webhookId: body.webhookId,
    event: 'lead.resent',
  })

  let sent = 0
  let failed = 0
  for (const r of results) r.ok ? sent++ : failed++

  return NextResponse.json({ total: responseIds.length, sent, failed })
}

// Respostas cujo log mais recente (por webhook) falhou
async function resolveFailedResponseIds(formId: string): Promise<string[]> {
  const { data: webhooks } = await supabaseAdmin
    .from('webhooks')
    .select('id')
    .eq('form_id', formId)
  const ids = (webhooks || []).map((w: any) => w.id)
  if (ids.length === 0) return []

  const { data: logs } = await supabaseAdmin
    .from('webhook_logs')
    .select('response_id, status_code, sent_at')
    .in('webhook_id', ids)
    .order('sent_at', { ascending: false })
    .limit(2000)

  const latest = new Map<string, number | null>()
  for (const l of logs || []) {
    if (!latest.has(l.response_id)) latest.set(l.response_id, l.status_code)
  }
  const failed: string[] = []
  Array.from(latest.entries()).forEach(([rid, code]) => {
    const ok = code !== null && code >= 200 && code < 300
    if (!ok) failed.push(rid)
  })
  return failed.slice(0, MAX_BATCH)
}
