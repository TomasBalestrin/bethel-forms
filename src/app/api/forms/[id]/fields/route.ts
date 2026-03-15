import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function POST(
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

  const data = await request.json()

  const { data: maxField } = await supabase
    .from('form_fields')
    .select('order')
    .eq('form_id', params.id)
    .order('order', { ascending: false })
    .limit(1)
    .single()

  const nextOrder = (maxField?.order ?? -1) + 1

  const { data: field, error } = await supabase
    .from('form_fields')
    .insert({
      form_id: params.id,
      type: data.type,
      order: nextOrder,
      title: data.title || '',
      description: data.description,
      required: data.required ?? false,
      placeholder: data.placeholder,
      settings: data.settings || {},
      media: data.media,
      logic: data.logic,
      conversion_event: data.conversionEvent ?? false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao criar campo' }, { status: 500 })
  }

  return NextResponse.json(field, { status: 201 })
}
