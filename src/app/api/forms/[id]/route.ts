import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

function mapFieldToCamel(f: any) {
  return {
    id: f.id,
    formId: f.form_id,
    type: f.type,
    order: f.order,
    title: f.title,
    description: f.description,
    required: f.required,
    placeholder: f.placeholder,
    settings: f.settings,
    media: f.media,
    logic: f.logic,
    conversionEvent: f.conversion_event,
    createdAt: f.created_at,
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .select('*, form_fields(*), responses(count)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const fields = (form.form_fields || [])
      .sort((a: any, b: any) => a.order - b.order)
      .map(mapFieldToCamel)

    return NextResponse.json({
      id: form.id,
      name: form.name,
      slug: form.slug,
      status: form.status,
      settings: form.settings,
      publishedVersion: form.published_version,
      createdAt: form.created_at,
      updatedAt: form.updated_at,
      fields,
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

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const data = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }
    if (data.name !== undefined) updateData.name = data.name
    if (data.slug !== undefined) updateData.slug = data.slug
    if (data.settings !== undefined) updateData.settings = data.settings

    const { data: updated, error } = await supabaseAdmin
      .from('forms')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating form:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Este slug já está em uso' }, { status: 409 })
      }
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

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const { error } = await supabaseAdmin.from('forms').delete().eq('id', params.id)
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
