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

    const results = await Promise.all(
      fieldIds.map((fieldId: string, index: number) =>
        supabaseAdmin
          .from('form_fields')
          .update({ order: index })
          .eq('id', fieldId)
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
