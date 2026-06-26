import { NextResponse } from 'next/server'
import { retryDue } from '@/lib/webhooks/dispatch'

export const dynamic = 'force-dynamic'

/**
 * Cron de retry dos webhooks (429/5xx/rede). Reprocessa entregas com
 * next_retry_at vencido. Protegido por CRON_SECRET (Vercel envia
 * `Authorization: Bearer <CRON_SECRET>` automaticamente quando a env existe).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET não configurado' }, { status: 500 })
  }
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { processed } = await retryDue()
  return NextResponse.json({ ok: true, processed })
}
