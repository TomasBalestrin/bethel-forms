import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function POST(
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

    const { data: fields } = await supabaseAdmin
      .from('form_fields')
      .select('*')
      .eq('form_id', params.id)
      .order('order', { ascending: true })

    const publishedVersion = {
      fields: (fields || []).map((f: any) => ({
        id: f.id,
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
      })),
    }

    const { data: updated, error } = await supabaseAdmin
      .from('forms')
      .update({
        status: 'published',
        published_version: publishedVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error publishing form:', error)
      return NextResponse.json({ error: 'Erro ao publicar formulário' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('POST /api/forms/[id]/publish error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
