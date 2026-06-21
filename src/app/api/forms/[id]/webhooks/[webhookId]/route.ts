import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { assertUrlAllowed } from '@/lib/webhooks/dispatch'

export const dynamic = 'force-dynamic'

async function ownForm(formId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('forms')
    .select('id')
    .eq('id', formId)
    .eq('user_id', userId)
    .single()
  return data
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; webhookId: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()
  if (!(await ownForm(params.id, user.id)))
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const update: Record<string, any> = {}
  if (typeof body.url === 'string') {
    try {
      await assertUrlAllowed(body.url)
    } catch (e: any) {
      return NextResponse.json({ error: e?.message || 'URL inválida' }, { status: 400 })
    }
    update.url = body.url
  }
  if (typeof body.name === 'string' || body.name === null) update.name = body.name
  if (typeof body.active === 'boolean') update.active = body.active
  if (body.headers && typeof body.headers === 'object') update.headers = body.headers

  if (Object.keys(update).length === 0)
    return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .update(update)
    .eq('id', params.webhookId)
    .eq('form_id', params.id)
    .select()
    .single()

  if (error || !data)
    return NextResponse.json({ error: 'Erro ao atualizar webhook' }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; webhookId: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()
  if (!(await ownForm(params.id, user.id)))
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  const { error } = await supabaseAdmin
    .from('webhooks')
    .delete()
    .eq('id', params.webhookId)
    .eq('form_id', params.id)

  if (error) return NextResponse.json({ error: 'Erro ao excluir webhook' }, { status: 500 })
  return NextResponse.json({ success: true })
}
