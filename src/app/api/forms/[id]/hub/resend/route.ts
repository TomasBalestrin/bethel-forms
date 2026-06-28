import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { dispatchHubBatch, hubReadiness, HUB_MAX_BATCH } from '@/lib/hub/dispatch'

export const dynamic = 'force-dynamic'

/**
 * Reenvia leads pro Hub.
 * Body: { responseId } | { responseIds: [] }.
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
  if (body.responseId) responseIds = [body.responseId]
  else if (Array.isArray(body.responseIds))
    responseIds = body.responseIds.filter((x: any) => typeof x === 'string')
  else return NextResponse.json({ error: 'Informe responseId ou responseIds' }, { status: 400 })

  if (responseIds.length === 0)
    return NextResponse.json({ error: 'Nenhuma resposta para reenviar' }, { status: 400 })
  if (responseIds.length > HUB_MAX_BATCH)
    return NextResponse.json({ error: `Máximo de ${HUB_MAX_BATCH} por lote` }, { status: 400 })

  // Mesma regra do envio automático: só reenvia se a integração estiver armada.
  const ready = await hubReadiness(params.id)
  if (!ready.armed) {
    const msg =
      ready.reason === 'schema mudou'
        ? 'O formulário mudou. Teste a integração com o Hub novamente antes de reenviar.'
        : ready.reason === 'nao testada'
          ? 'Teste a integração com o Hub antes de reenviar.'
          : ready.reason === 'desativada'
            ? 'Integração com o Hub está desativada.'
            : 'Selecione um grupo na integração com o Hub.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Garante que as respostas pertencem ao form.
  const { data: valid } = await supabaseAdmin
    .from('responses')
    .select('id')
    .eq('form_id', params.id)
    .in('id', responseIds)
  const validIds = new Set((valid || []).map((r: any) => r.id))
  const ids = responseIds.filter((rid) => validIds.has(rid))

  const results = await dispatchHubBatch(params.id, ids, { event: 'lead.resent' })

  let sent = 0
  let failed = 0
  for (const r of results) r.ok ? sent++ : failed++

  return NextResponse.json({ total: responseIds.length, sent, failed })
}
