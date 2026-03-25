import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id')
      .eq('slug', params.slug)
      .single()

    if (!form) {
      return NextResponse.json(
        { error: 'Formulário não encontrado' },
        { status: 404 }
      )
    }

    const { responseId, fieldId, value } = await request.json()

    if (!responseId || !fieldId) {
      return NextResponse.json(
        { error: 'responseId e fieldId são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: response } = await supabaseAdmin
      .from('responses')
      .select('id, status')
      .eq('id', responseId)
      .eq('form_id', form.id)
      .single()

    if (!response) {
      return NextResponse.json(
        { error: 'Resposta não encontrada' },
        { status: 404 }
      )
    }

    if (response.status === 'complete') {
      return NextResponse.json(
        { error: 'Resposta já finalizada' },
        { status: 400 }
      )
    }

    // Check for existing answer
    const { data: existingAnswer } = await supabaseAdmin
      .from('response_answers')
      .select('id')
      .eq('response_id', responseId)
      .eq('field_id', fieldId)
      .single()

    let answer
    if (existingAnswer) {
      const { data, error } = await supabaseAdmin
        .from('response_answers')
        .update({ value, answered_at: new Date().toISOString() })
        .eq('id', existingAnswer.id)
        .select()
        .single()
      if (error) {
        console.error('Error updating answer:', error)
        return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })
      }
      answer = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('response_answers')
        .insert({ response_id: responseId, field_id: fieldId, value })
        .select()
        .single()
      if (error) {
        console.error('Error inserting answer:', error)
        return NextResponse.json({ error: 'Erro ao salvar resposta' }, { status: 500 })
      }
      answer = data
    }

    return NextResponse.json(answer)
  } catch (error) {
    console.error('POST /api/public/forms/[slug]/answer error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
