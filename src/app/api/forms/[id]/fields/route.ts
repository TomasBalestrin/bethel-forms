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
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const data = await request.json()

    const VALID_FIELD_TYPES = [
      'welcome', 'thanks', 'message',
      'short_text', 'long_text', 'email', 'phone', 'number', 'cpf',
      'multiple_choice', 'checkbox', 'satisfaction_scale',
      'date', 'url', 'file_upload', 'currency',
    ]

    if (!data.type || !VALID_FIELD_TYPES.includes(data.type)) {
      return NextResponse.json({ error: 'Tipo de campo inválido' }, { status: 400 })
    }

    // Get all existing fields ordered
    const { data: existingFields } = await supabaseAdmin
      .from('form_fields')
      .select('id, type, order')
      .eq('form_id', params.id)
      .order('order', { ascending: true })

    const allFields = existingFields || []

    // Insert position: before thanks if adding a non-thanks field, otherwise at end
    let insertOrder: number
    if (data.type !== 'thanks') {
      const thanksIndex = allFields.findIndex((f) => f.type === 'thanks')
      if (thanksIndex > -1) {
        insertOrder = thanksIndex
        // Shift thanks and any fields after it
        const toShift = allFields.slice(thanksIndex)
        await Promise.all(
          toShift.map((f, i) =>
            supabaseAdmin
              .from('form_fields')
              .update({ order: thanksIndex + 1 + i })
              .eq('id', f.id)
          )
        )
      } else {
        insertOrder = allFields.length
      }
    } else {
      insertOrder = allFields.length
    }

    const DEFAULT_TITLES: Record<string, string> = {
      short_text: 'Sua resposta',
      long_text: 'Sua resposta',
      email: 'Seu email',
      phone: 'Seu telefone',
      number: 'Número',
      cpf: 'Seu CPF',
      multiple_choice: 'Escolha uma opção',
      checkbox: 'Selecione as opções',
      satisfaction_scale: 'Sua avaliação',
      date: 'Data',
      url: 'URL',
      currency: 'Valor',
      file_upload: 'Envie seu arquivo',
      welcome: 'Bem-vindo!',
      thanks: 'Obrigado!',
      message: 'Mensagem',
    }

    const { data: field, error } = await supabaseAdmin
      .from('form_fields')
      .insert({
        form_id: params.id,
        type: data.type,
        order: insertOrder,
        title: data.title || DEFAULT_TITLES[data.type] || '',
        description: data.description || '',
        required: data.required ?? false,
        placeholder: data.placeholder || '',
        settings: data.settings || {},
        media: data.media || null,
        logic: data.logic || null,
        conversion_event: data.conversionEvent ?? false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating field:', error)
      return NextResponse.json({ error: 'Erro ao criar campo' }, { status: 500 })
    }

    return NextResponse.json({
      id: field.id,
      formId: field.form_id,
      type: field.type,
      order: field.order,
      title: field.title,
      description: field.description,
      required: field.required,
      placeholder: field.placeholder,
      settings: field.settings,
      media: field.media,
      logic: field.logic,
      conversionEvent: field.conversion_event,
    }, { status: 201 })
  } catch (error) {
    console.error('POST /api/forms/[id]/fields error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
