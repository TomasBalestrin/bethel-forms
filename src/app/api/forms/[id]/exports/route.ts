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
      .select('*, response_answers(*)')
      .eq('form_id', params.id)
      .eq('status', 'complete')
      .order('created_at', { ascending: false })

    const { data: fields } = await supabaseAdmin
      .from('form_fields')
      .select('*')
      .eq('form_id', params.id)
      .order('order', { ascending: true })

    // Filter out non-question fields
    const currentQuestionFields = (fields || []).filter(
      (f: any) => !['welcome', 'thanks', 'message'].includes(f.type)
    )

    // Collect field info from response answers to include fields that were
    // deleted/changed since the responses were collected
    const currentFieldIds = new Set(currentQuestionFields.map((f: any) => f.id))
    const extraFieldsMap = new Map<string, { id: string; title: string; type: string; order: number }>()

    // We need field info from answers - re-fetch responses with field join
    const { data: responsesWithFields } = await supabaseAdmin
      .from('responses')
      .select('response_answers(field_id, form_fields(id, title, type, order))')
      .eq('form_id', params.id)
      .eq('status', 'complete')

    ;(responsesWithFields || []).forEach((r: any) => {
      ;(r.response_answers || []).forEach((a: any) => {
        if (a.form_fields && !currentFieldIds.has(a.form_fields.id) &&
            !['welcome', 'thanks', 'message'].includes(a.form_fields.type)) {
          extraFieldsMap.set(a.form_fields.id, a.form_fields)
        }
      })
    })

    const extraFields = Array.from(extraFieldsMap.values()).sort((a, b) => (a.order || 0) - (b.order || 0))
    const questionFields = [...currentQuestionFields, ...extraFields]

    const csvHeaders = [
      'Data',
      ...questionFields.map((f: any) => f.title || f.type),
      'Status',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
    ]

    const rows = (responses || []).map((r: any) => {
      const meta = r.metadata as any
      const answers = r.response_answers || []
      const row = [
        new Date(r.created_at).toISOString(),
        ...questionFields.map((f: any) => {
          // Match using field_id (snake_case from DB)
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
      return row.map((v: any) => {
        let s = String(v).replace(/"/g, '""')
        // Prevent CSV formula injection
        if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
        return `"${s}"`
      }).join(',')
    })

    const csv = [csvHeaders.map((h) => `"${h}"`).join(','), ...rows].join('\n')

    if (exportRecord) {
      await supabaseAdmin
        .from('exports')
        .update({ status: 'ready', completed_at: new Date().toISOString() })
        .eq('id', exportRecord.id)
    }

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${form.name.replace(/["\n\r]/g, '_')}.csv"`,
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
