import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { postSigned } from '@/lib/webhooks/dispatch'

export const dynamic = 'force-dynamic'

// Dispara um payload de exemplo (assinado, formato do receptor). Não grava log.
export async function POST(
  _request: Request,
  { params }: { params: { id: string; webhookId: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!form) return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  const { data: webhook } = await supabaseAdmin
    .from('webhooks')
    .select('*')
    .eq('id', params.webhookId)
    .eq('form_id', params.id)
    .single()
  if (!webhook) return NextResponse.json({ error: 'Webhook não encontrado' }, { status: 404 })

  if (!webhook.secret) {
    return NextResponse.json({ ok: false, error: 'Secret não configurado' }, { status: 200 })
  }

  const payload = {
    event_id: 'test',
    evento: { tipo: 'webhook.test', occurred_at: new Date().toISOString() },
    campos_extras: { Nome: 'Teste', Email: 'teste@exemplo.com', Telefone: '11999998888' },
  }

  // Mesma rotina de assinatura do envio real (HMAC + X-Timestamp/X-Signature).
  const { statusCode, error } = await postSigned(webhook, JSON.stringify(payload))
  const ok = statusCode !== null && statusCode >= 200 && statusCode < 300
  return NextResponse.json({ ok, statusCode, error })
}
