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
      .select('id')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (!form) {
      return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
    }

    const [totalResult, completeResult, partialResult, durationResult] = await Promise.all([
      supabaseAdmin.from('responses').select('*', { count: 'exact', head: true }).eq('form_id', params.id),
      supabaseAdmin.from('responses').select('*', { count: 'exact', head: true }).eq('form_id', params.id).eq('status', 'complete'),
      supabaseAdmin.from('responses').select('*', { count: 'exact', head: true }).eq('form_id', params.id).eq('status', 'partial'),
      supabaseAdmin.from('responses').select('duration_seconds').eq('form_id', params.id).eq('status', 'complete').not('duration_seconds', 'is', null),
    ])

    const totalResponses = totalResult.count || 0
    const completeResponses = completeResult.count || 0
    const partialResponses = partialResult.count || 0

    // Filter out outliers (> 1 hour)
    const durations = (durationResult.data || [])
      .map((r: any) => r.duration_seconds)
      .filter((d: number) => d > 0 && d <= 3600)
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
