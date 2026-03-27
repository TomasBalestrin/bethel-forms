import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const { data: response, error } = await supabaseAdmin
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
  } catch (error) {
    console.error('GET /api/forms/[id]/responses/[responseId] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { color } = body
    const tags = color ? [color] : []

    const { error } = await supabaseAdmin
      .from('responses')
      .update({ tags })
      .eq('id', params.responseId)
      .eq('form_id', params.id)

    if (error) {
      console.error('Error updating response tags:', error)
      return NextResponse.json({ error: 'Erro ao atualizar tag' }, { status: 500 })
    }

    return NextResponse.json({ success: true, tags })
  } catch (error) {
    console.error('PATCH /api/forms/[id]/responses/[responseId] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const { error } = await supabaseAdmin.from('responses').delete().eq('id', params.responseId)
    if (error) {
      console.error('Error deleting response:', error)
      return NextResponse.json({ error: 'Erro ao excluir resposta' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/forms/[id]/responses/[responseId] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
