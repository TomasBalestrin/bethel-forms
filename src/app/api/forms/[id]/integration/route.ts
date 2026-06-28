import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import type { FormIntegration } from '@/types'

export const dynamic = 'force-dynamic'

/**
 * Salva a config da integração Hub em forms.settings.integration.
 * Body (parcial): { enabled, grupo_id, grupo_nome, etapa_id, etapa_nome }.
 * Trocar grupo/etapa zera tested_at + fields_signature (exige novo teste).
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('settings')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!form) return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const settings = form.settings || {}
  const current: FormIntegration = settings.integration || {}
  const next: FormIntegration = { ...current }

  if (body.enabled !== undefined) next.enabled = !!body.enabled
  if (body.grupo_id !== undefined) next.grupo_id = body.grupo_id || null
  if (body.grupo_nome !== undefined) next.grupo_nome = body.grupo_nome || null
  if (body.etapa_id !== undefined) next.etapa_id = body.etapa_id || null
  if (body.etapa_nome !== undefined) next.etapa_nome = body.etapa_nome || null

  // Mudou destino => precisa testar de novo.
  const grupoChanged = body.grupo_id !== undefined && (body.grupo_id || null) !== (current.grupo_id || null)
  const etapaChanged = body.etapa_id !== undefined && (body.etapa_id || null) !== (current.etapa_id || null)
  if (grupoChanged || etapaChanged) {
    next.tested_at = null
    next.fields_signature = null
  }

  const { error } = await supabaseAdmin
    .from('forms')
    .update({ settings: { ...settings, integration: next } })
    .eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Erro ao salvar integração' }, { status: 500 })

  return NextResponse.json({ integration: next })
}
