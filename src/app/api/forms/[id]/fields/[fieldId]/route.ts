import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
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

  const data = await request.json()

  const updateData: any = {}
  if (data.title !== undefined) updateData.title = data.title
  if (data.description !== undefined) updateData.description = data.description
  if (data.required !== undefined) updateData.required = data.required
  if (data.placeholder !== undefined) updateData.placeholder = data.placeholder
  if (data.settings !== undefined) updateData.settings = data.settings
  if (data.media !== undefined) updateData.media = data.media
  if (data.logic !== undefined) updateData.logic = data.logic
  if (data.conversionEvent !== undefined) updateData.conversion_event = data.conversionEvent
  if (data.type !== undefined) updateData.type = data.type

  const { data: field, error } = await supabase
    .from('form_fields')
    .update(updateData)
    .eq('id', params.fieldId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao atualizar campo' }, { status: 500 })
  }

  return NextResponse.json(field)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
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

  await supabase.from('form_fields').delete().eq('id', params.fieldId)

  return NextResponse.json({ success: true })
}
