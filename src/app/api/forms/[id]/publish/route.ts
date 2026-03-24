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

    if (!fields || fields.length === 0) {
      return NextResponse.json({ error: 'O formulário não possui campos' }, { status: 400 })
    }

    // Validate: must have at least one question field (not just welcome/thanks/message)
    const questionFields = fields.filter(
      (f) => !['welcome', 'thanks', 'message'].includes(f.type)
    )
    if (questionFields.length === 0) {
      return NextResponse.json(
        { error: 'O formulário precisa ter pelo menos um campo de pergunta' },
        { status: 400 }
      )
    }

    // Ensure thanks field exists at end
    const hasEnding = fields.some((f) => f.type === 'thanks')
    if (!hasEnding) {
      // Auto-add a thanks field
      const maxOrder = fields[fields.length - 1]?.order ?? fields.length
      await supabaseAdmin.from('form_fields').insert({
        form_id: params.id,
        type: 'thanks',
        order: maxOrder + 1,
        title: 'Obrigado!',
        description: 'Suas respostas foram enviadas com sucesso.',
        settings: { thanksType: 'message' },
      })
      // Re-fetch fields after adding thanks
      const { data: updatedFields } = await supabaseAdmin
        .from('form_fields')
        .select('*')
        .eq('form_id', params.id)
        .order('order', { ascending: true })

      if (updatedFields) {
        fields.length = 0
        fields.push(...updatedFields)
      }
    }

    // Build published version snapshot
    const publishedVersion = {
      fields: fields.map((f: any) => ({
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
