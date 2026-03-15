import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form } = await supabase
      .from('forms')
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const [totalResult, completeResult, partialResult, durationResult] = await Promise.all([
      supabase.from('responses').select('*', { count: 'exact', head: true }).eq('form_id', params.id),
      supabase.from('responses').select('*', { count: 'exact', head: true }).eq('form_id', params.id).eq('status', 'complete'),
      supabase.from('responses').select('*', { count: 'exact', head: true }).eq('form_id', params.id).eq('status', 'partial'),
      supabase.from('responses').select('duration_seconds').eq('form_id', params.id).eq('status', 'complete').not('duration_seconds', 'is', null),
    ])

    const totalResponses = totalResult.count || 0
    const completeResponses = completeResult.count || 0
    const partialResponses = partialResult.count || 0

    const durations = (durationResult.data || []).map((r: any) => r.duration_seconds).filter(Boolean)
    const avgDurationSeconds = durations.length > 0
      ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
      : 0

    const completionRate = totalResponses > 0
      ? Math.round((completeResponses / totalResponses) * 100)
      : 0

    return NextResponse.json({
      totalResponses,
      completeResponses,
      partialResponses,
      completionRate,
      avgDurationSeconds,
    })
  } catch (error) {
    console.error('GET /api/forms/[id]/metrics error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
