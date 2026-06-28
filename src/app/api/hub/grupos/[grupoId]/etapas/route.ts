import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getEtapas } from '@/lib/hub/client'

export const dynamic = 'force-dynamic'

// Proxy autenticado: lista etapas de um grupo do Hub.
export async function GET(_request: Request, { params }: { params: { grupoId: string } }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()
  try {
    const data = await getEtapas(params.grupoId)
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao listar etapas' }, { status: 502 })
  }
}
