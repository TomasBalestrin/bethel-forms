import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { getGrupos } from '@/lib/hub/client'

export const dynamic = 'force-dynamic'

// Proxy autenticado: lista grupos do Hub (a key fica no server).
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()
  try {
    const data = await getGrupos()
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao listar grupos' }, { status: 502 })
  }
}
