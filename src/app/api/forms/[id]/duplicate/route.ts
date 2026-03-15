import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { generateSlug } from '@/lib/utils'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: original } = await supabase
    .from('forms')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!original) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const { data: originalFields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', params.id)
    .order('order', { ascending: true })

  const { data: newForm, error } = await supabase
    .from('forms')
    .insert({
      user_id: user.id,
      name: `${original.name} (cópia)`,
      slug: generateSlug(),
      settings: original.settings,
      draft_version: original.draft_version,
    })
    .select()
    .single()

  if (error || !newForm) {
    return NextResponse.json({ error: 'Erro ao duplicar formulário' }, { status: 500 })
  }

  if (originalFields && originalFields.length > 0) {
    await supabase.from('form_fields').insert(
      originalFields.map((f: any) => ({
        form_id: newForm.id,
        type: f.type,
        order: f.order,
        title: f.title,
        description: f.description,
        required: f.required,
        placeholder: f.placeholder,
        settings: f.settings,
        media: f.media,
        logic: f.logic,
        conversion_event: f.conversion_event,
      }))
    )
  }

  return NextResponse.json(newForm, { status: 201 })
}
