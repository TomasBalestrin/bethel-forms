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

  const { responseId } = await request.json()

  if (!responseId) {
    return NextResponse.json(
      { error: 'responseId é obrigatório' },
      { status: 400 }
    )
  }

  const { data: response } = await supabase
    .from('responses')
    .select('*')
    .eq('id', responseId)
    .eq('form_id', form.id)
    .single()

  if (!response) {
    return NextResponse.json(
      { error: 'Resposta não encontrada' },
      { status: 404 }
    )
  }

  const startedAt = new Date(response.started_at)
  const completedAt = new Date()
  const durationSeconds = Math.round(
    (completedAt.getTime() - startedAt.getTime()) / 1000
  )

  const { data: updated } = await supabase
    .from('responses')
    .update({
      status: 'complete',
      completed_at: completedAt.toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', responseId)
    .select()
    .single()

  return NextResponse.json(updated)
}
