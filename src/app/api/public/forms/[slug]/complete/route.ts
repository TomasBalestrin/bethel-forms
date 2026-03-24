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

    const { data: response } = await supabaseAdmin
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

    const { data: updated, error } = await supabaseAdmin
      .from('responses')
      .update({
        status: 'complete',
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .eq('id', responseId)
      .select()
      .single()

    if (error) {
      console.error('Error completing response:', error)
      return NextResponse.json({ error: 'Erro ao completar resposta' }, { status: 500 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('POST /api/public/forms/[slug]/complete error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
