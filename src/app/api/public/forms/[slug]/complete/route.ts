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

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
    }
    const { responseId } = body

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

    // Don't re-complete already completed responses
    if (response.status === 'complete') {
      return NextResponse.json(response)
    }

    const completedAt = new Date()
    let durationSeconds = 0

    // Use started_at or created_at for duration calculation
    const startTime = response.started_at || response.created_at
    if (startTime) {
      const startedAt = new Date(startTime)
      if (!isNaN(startedAt.getTime())) {
        durationSeconds = Math.round(
          (completedAt.getTime() - startedAt.getTime()) / 1000
        )
        // Cap at 1 hour to exclude abandoned sessions
        if (durationSeconds > 3600) durationSeconds = 0
      }
    }

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
