import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { assertUrlAllowed } from '@/lib/webhooks/dispatch'

export const dynamic = 'force-dynamic'

// Dispara um payload de exemplo para validar a configuração. Não grava log.
export async function POST(
  _request: Request,
  { params }: { params: { id: string; webhookId: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id, name, slug')
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

  try {
    await assertUrlAllowed(webhook.url)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'URL inválida' }, { status: 200 })
  }

  const payload = {
    event: 'webhook.test',
    form: { id: form.id, name: form.name, slug: form.slug },
    response: { id: 'test', status: 'complete', metadata: {} },
    answers: [{ fieldId: null, fieldTitle: 'Nome', fieldType: 'short_text', value: 'Teste' }],
    data: { Nome: 'Teste' },
  }

  let statusCode: number | null = null
  let error: string | null = null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
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
    } finally {
      clearTimeout(timer)
    }
  } catch (e: any) {
    error = e?.name === 'AbortError' ? 'Timeout' : e?.message || 'Falha de rede'
  }

  const ok = statusCode !== null && statusCode >= 200 && statusCode < 300
  return NextResponse.json({ ok, statusCode, error })
}
