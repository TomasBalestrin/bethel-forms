import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form, error } = await supabase
      .from('forms')
      .select('*, form_fields(*), responses(count)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const fields = (form.form_fields || []).sort((a: any, b: any) => a.order - b.order)
    return NextResponse.json({
      ...form,
      fields,
      form_fields: undefined,
      _count: { responses: form.responses?.[0]?.count ?? 0 },
    })
  } catch (error) {
    console.error('GET /api/forms/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form } = await supabase
      .from('forms')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const data = await request.json()

    const { data: updated, error } = await supabase
      .from('forms')
      .update({
        name: data.name ?? form.name,
        slug: data.slug ?? form.slug,
        settings: data.settings ?? form.settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating form:', error)
      return NextResponse.json({ error: 'Erro ao atualizar formulário' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/forms/[id] error:', error)
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

    const { data: form } = await supabase
      .from('forms')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const { error } = await supabase.from('forms').delete().eq('id', params.id)
    if (error) {
      console.error('Error deleting form:', error)
      return NextResponse.json({ error: 'Erro ao excluir formulário' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/forms/[id] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
