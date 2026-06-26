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

// Nunca expor o secret: troca por has_secret.
function maskSecret(wh: any) {
  if (!wh) return wh
  const { secret, ...rest } = wh
  return { ...rest, has_secret: !!secret }
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()
  if (!(await ownForm(params.id, user.id)))
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .select('*')
    .eq('form_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: 'Erro ao buscar webhooks' }, { status: 500 })
  return NextResponse.json({ webhooks: (data || []).map(maskSecret) })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
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

  const { url, name, headers, secret } = body
  if (!url || typeof url !== 'string')
    return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 })

  try {
    await assertUrlAllowed(url)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'URL inválida' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('webhooks')
    .insert({
      form_id: params.id,
      url,
      name: name || null,
      headers: headers && typeof headers === 'object' ? headers : {},
      secret: typeof secret === 'string' && secret.trim() ? secret.trim() : null,
      active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Erro ao criar webhook' }, { status: 500 })
  return NextResponse.json(maskSecret(data), { status: 201 })
}
