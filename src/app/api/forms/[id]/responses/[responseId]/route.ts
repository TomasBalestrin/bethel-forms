import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
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

  const { data: response, error } = await supabase
    .from('responses')
    .select('*, response_answers(*, form_fields(*))')
    .eq('id', params.responseId)
    .eq('form_id', params.id)
    .single()

  if (error || !response) {
    return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 })
  }

  return NextResponse.json({
    ...response,
    answers: (response.response_answers || []).map((a: any) => ({
      ...a,
      field: a.form_fields,
      form_fields: undefined,
    })),
    response_answers: undefined,
  })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
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

  await supabase.from('responses').delete().eq('id', params.responseId)

  return NextResponse.json({ success: true })
}
