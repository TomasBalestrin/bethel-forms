import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { sendTest } from '@/lib/hub/dispatch'

export const dynamic = 'force-dynamic'

// Envia um lead de teste REAL (perguntas do form + dados fictícios). Em 2xx,
// arma a integração (grava assinatura do schema + tested_at).
export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!form) return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

  const r = await sendTest(params.id)
  return NextResponse.json(r)
}
