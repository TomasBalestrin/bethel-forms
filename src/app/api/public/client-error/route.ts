import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Recebe erros de render do client (ex: WebView in-app do Facebook) para
// aparecerem nos logs do servidor. Sem auth (caminho público), sem persistência.
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))
    console.error(
      '[client-error]',
      JSON.stringify({
        message: body?.message,
        digest: body?.digest,
        url: body?.url,
        userAgent: body?.userAgent,
        scope: body?.scope || 'public',
        stack: typeof body?.stack === 'string' ? body.stack.slice(0, 2000) : undefined,
      })
    )
  } catch {}
  return NextResponse.json({ ok: true })
}
