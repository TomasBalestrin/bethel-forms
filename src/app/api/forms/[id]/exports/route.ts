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

    const { format, filters } = await request.json()

    const { data: exportRecord } = await supabaseAdmin
      .from('exports')
      .insert({
        form_id: params.id,
        user_id: user.id,
        format: format || 'csv',
        filters: filters || {},
      })
      .select()
      .single()

    const { data: responses } = await supabaseAdmin
      .from('responses')
      .select('*, response_answers(*, form_fields(*))')
      .eq('form_id', params.id)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })

    const { data: fields } = await supabaseAdmin
      .from('form_fields')
      .select('*')
      .eq('form_id', params.id)
      .not('type', 'in', '("welcome","thanks","message")')
      .order('order', { ascending: true })

    const headers = ['Data', ...(fields || []).map((f: any) => f.title), 'Status', 'UTM Source', 'UTM Medium', 'UTM Campaign']
    const rows = (responses || []).map((r: any) => {
      const meta = r.metadata as any
      const answers = r.response_answers || []
      const row = [
        new Date(r.created_at).toISOString(),
        ...(fields || []).map((f: any) => {
          const answer = answers.find((a: any) => a.field_id === f.id)
          const value = answer?.value
          if (value === null || value === undefined) return ''
          if (typeof value === 'object') return JSON.stringify(value)
          return String(value)
        }),
        r.status,
        meta?.utm_source || '',
        meta?.utm_medium || '',
        meta?.utm_campaign || '',
      ]
      return row.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })

    const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n')

    if (exportRecord) {
      await supabaseAdmin
        .from('exports')
        .update({ status: 'ready', completed_at: new Date().toISOString() })
        .eq('id', exportRecord.id)
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${form.name}.csv"`,
      },
    })
  } catch (error) {
    console.error('POST /api/forms/[id]/exports error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: exports, error } = await supabaseAdmin
      .from('exports')
      .select('*')
      .eq('form_id', params.id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching exports:', error)
      return NextResponse.json({ error: 'Erro ao buscar exportações' }, { status: 500 })
    }

    return NextResponse.json(exports || [])
  } catch (error) {
    console.error('GET /api/forms/[id]/exports error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
