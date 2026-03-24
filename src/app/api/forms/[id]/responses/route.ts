import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const status = url.searchParams.get('status')

    let query = supabaseAdmin
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
      console.error('Error fetching responses:', error)
      return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
    }

    const transformed = (responses || []).map((r: any) => ({
      ...r,
      createdAt: r.created_at,
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
  } catch (error) {
    console.error('GET /api/forms/[id]/responses error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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

    const { error } = await supabaseAdmin.from('responses').delete().eq('form_id', params.id)
    if (error) {
      console.error('Error deleting responses:', error)
      return NextResponse.json({ error: 'Erro ao excluir respostas' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/forms/[id]/responses error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
