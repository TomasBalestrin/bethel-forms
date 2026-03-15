import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const status = url.searchParams.get('status')

  let query = supabase
    .from('responses')
    .select('*, response_answers(*, form_fields(*))', { count: 'exact' })
    .eq('form_id', params.id)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: responses, count, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
  }

  const transformed = (responses || []).map((r: any) => ({
    ...r,
    answers: (r.response_answers || []).map((a: any) => ({
      ...a,
      field: a.form_fields,
      form_fields: undefined,
    })),
    response_answers: undefined,
  }))

  const total = count || 0

  return NextResponse.json({
    responses: transformed,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  await supabase.from('responses').delete().eq('form_id', params.id)

  return NextResponse.json({ success: true })
}
