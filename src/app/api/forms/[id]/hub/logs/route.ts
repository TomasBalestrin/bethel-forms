import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// Lista disparos pro Hub (teste, automático e reenvio), paginado.
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!form) return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1') || 1)
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50') || 50))
  const status = url.searchParams.get('status') // 'success' | 'failed'

  let query = supabaseAdmin
    .from('hub_logs')
    .select('*', { count: 'exact' })
    .eq('form_id', params.id)
    .order('sent_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (status === 'success') query = query.gte('status_code', 200).lt('status_code', 300)
  else if (status === 'failed')
    query = query.or('status_code.is.null,status_code.lt.200,status_code.gte.300')

  const { data, count, error } = await query
  if (error) return NextResponse.json({ error: 'Erro ao buscar logs' }, { status: 500 })

  const total = count || 0
  return NextResponse.json({
    logs: data || [],
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}
