import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function PATCH(
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

    const { fieldIds } = await request.json()

    if (!Array.isArray(fieldIds) || fieldIds.length === 0) {
      return NextResponse.json({ error: 'fieldIds é obrigatório' }, { status: 400 })
    }

    // Verify all fieldIds belong to this form
    const { data: existingFields } = await supabaseAdmin
      .from('form_fields')
      .select('id')
      .eq('form_id', params.id)

    const validIds = new Set((existingFields || []).map((f) => f.id))
    const invalid = fieldIds.filter((id: string) => !validIds.has(id))
    if (invalid.length > 0) {
      return NextResponse.json({ error: 'IDs de campo inválidos' }, { status: 400 })
    }

    // Ensure all form fields are included (no partial reorders)
    if (fieldIds.length !== validIds.size) {
      return NextResponse.json(
        { error: 'Todos os campos do formulário devem ser incluídos na reordenação' },
        { status: 400 }
      )
    }

    const results = await Promise.all(
      fieldIds.map((fieldId: string, index: number) =>
        supabaseAdmin
          .from('form_fields')
          .update({ order: index })
          .eq('id', fieldId)
          .eq('form_id', params.id)
      )
    )

    const failed = results.find((r) => r.error)
    if (failed?.error) {
      console.error('Error reordering fields:', failed.error)
      return NextResponse.json({ error: 'Erro ao reordenar campos' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/forms/[id]/fields/reorder error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
