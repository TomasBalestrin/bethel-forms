import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form } = await supabaseAdmin
      .from('forms')
      .select('id, settings')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const url = new URL(request.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1)
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50') || 50))
    const status = url.searchParams.get('status')

    let query = supabaseAdmin
      .from('responses')
      .select('*, response_answers(*, form_fields(*))', { count: 'exact' })
      .eq('form_id', params.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: responses, count, error } = await query

    if (error) {
      console.error('Error fetching responses:', error)
      return NextResponse.json({ error: 'Erro ao buscar respostas' }, { status: 500 })
    }

    const responseIds = (responses || []).map((r: any) => r.id)

    // Canais configurados: webhook (existe webhook) e hub (integração ativa).
    const { data: webhooks } = await supabaseAdmin
      .from('webhooks')
      .select('id')
      .eq('form_id', params.id)
    const webhookIds = (webhooks || []).map((w: any) => w.id)
    const hubEnabled = !!(form as any).settings?.integration?.enabled
    const channels = { webhook: webhookIds.length > 0, hub: hubEnabled }

    // Último status por resposta em cada canal.
    const webhookStatus = new Map<string, { statusCode: number | null; error: string | null }>()
    if (webhookIds.length > 0 && responseIds.length > 0) {
      const { data: wLogs } = await supabaseAdmin
        .from('webhook_logs')
        .select('response_id, status_code, error, sent_at')
        .in('webhook_id', webhookIds)
        .in('response_id', responseIds)
        .order('sent_at', { ascending: false })
      for (const l of wLogs || []) {
        if (!webhookStatus.has(l.response_id))
          webhookStatus.set(l.response_id, { statusCode: l.status_code, error: l.error })
      }
    }

    const hubStatus = new Map<string, { statusCode: number | null; error: string | null; acao: string | null }>()
    if (channels.hub && responseIds.length > 0) {
      const { data: hLogs } = await supabaseAdmin
        .from('hub_logs')
        .select('response_id, status_code, error, acao, sent_at')
        .eq('form_id', params.id)
        .in('response_id', responseIds)
        .order('sent_at', { ascending: false })
      for (const l of hLogs || []) {
        if (l.response_id && !hubStatus.has(l.response_id))
          hubStatus.set(l.response_id, { statusCode: l.status_code, error: l.error, acao: l.acao })
      }
    }

    const transformed = (responses || []).map((r: any) => ({
      id: r.id,
      formId: r.form_id,
      status: r.status,
      metadata: r.metadata,
      tags: r.tags || [],
      createdAt: r.created_at,
      completedAt: r.completed_at,
      durationSeconds: r.duration_seconds,
      dispatchStatus: {
        webhook: webhookStatus.get(r.id) || null,
        hub: hubStatus.get(r.id) || null,
      },
      answers: (r.response_answers || []).map((a: any) => ({
        id: a.id,
        responseId: a.response_id,
        fieldId: a.field_id,
        value: a.value,
        answeredAt: a.answered_at,
        field: a.form_fields
          ? {
              id: a.form_fields.id,
              type: a.form_fields.type,
              title: a.form_fields.title,
              order: a.form_fields.order,
            }
          : null,
      })),
    }))

    const total = count || 0

    return NextResponse.json({
      responses: transformed,
      channels,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('GET /api/forms/[id]/responses error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { error } = await supabaseAdmin.from('responses').delete().eq('form_id', params.id)
    if (error) {
      console.error('Error deleting responses:', error)
      return NextResponse.json({ error: 'Erro ao excluir respostas' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/forms/[id]/responses error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
