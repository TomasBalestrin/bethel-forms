import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { data: form } = await supabase
    .from('forms')
    .select('id')
    .eq('slug', params.slug)
    .eq('status', 'published')
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

  const { data: response } = await supabase
    .from('responses')
    .select('id')
    .eq('id', responseId)
    .eq('form_id', form.id)
    .single()

  if (!response) {
    return NextResponse.json(
      { error: 'Resposta não encontrada' },
      { status: 404 }
    )
  }

  // Check for existing answer
  const { data: existingAnswer } = await supabase
    .from('response_answers')
    .select('id')
    .eq('response_id', responseId)
    .eq('field_id', fieldId)
    .single()

  let answer
  if (existingAnswer) {
    const { data } = await supabase
      .from('response_answers')
      .update({ value, answered_at: new Date().toISOString() })
      .eq('id', existingAnswer.id)
      .select()
      .single()
    answer = data
  } else {
    const { data } = await supabase
      .from('response_answers')
      .insert({ response_id: responseId, field_id: fieldId, value })
      .select()
      .single()
    answer = data
  }

  return NextResponse.json(answer)
}
