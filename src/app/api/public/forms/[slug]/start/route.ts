import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { headers } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { data: form, error } = await supabase
      .from('forms')
      .select('*')
      .eq('slug', params.slug)
      .eq('status', 'published')
      .single()

    if (error || !form) {
      return NextResponse.json(
        { error: 'Formulário não encontrado' },
        { status: 404 }
      )
    }

    const settings = form.settings as any
    if (form.status === 'blocked') {
      return NextResponse.json(
        { error: settings?.blockedMessage || 'Este formulário não está aceitando respostas.' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const headersList = headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || ''

    const metadata: any = {
      ip,
      user_agent: userAgent,
    }

    if (settings?.tracking?.utmEnabled && body.utms) {
      metadata.utm_source = body.utms.utm_source || null
      metadata.utm_medium = body.utms.utm_medium || null
      metadata.utm_campaign = body.utms.utm_campaign || null
      metadata.utm_term = body.utms.utm_term || null
      metadata.utm_content = body.utms.utm_content || null
    }

    const { data: response, error: insertError } = await supabase
      .from('responses')
      .insert({
        form_id: form.id,
        status: 'partial',
        metadata,
      })
      .select('id')
      .single()

    if (insertError || !response) {
      console.error('Error starting response:', insertError)
      return NextResponse.json({ error: 'Erro ao iniciar resposta' }, { status: 500 })
    }

    return NextResponse.json({ responseId: response.id }, { status: 201 })
  } catch (error) {
    console.error('POST /api/public/forms/[slug]/start error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
