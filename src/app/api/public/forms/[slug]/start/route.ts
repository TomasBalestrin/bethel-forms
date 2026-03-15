import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const form = await prisma.form.findFirst({
    where: { slug: params.slug, status: 'published' },
  })

  if (!form) {
    return NextResponse.json(
      { error: 'Formulário não encontrado' },
      { status: 404 }
    )
  }

  // Check if form is blocked
  const settings = form.settings as any
  if (form.status === 'blocked') {
    return NextResponse.json(
      { error: settings?.blockedMessage || 'Este formulário não está aceitando respostas.' },
      { status: 403 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const headersList = headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || ''

  const metadata: any = {
    ip,
    user_agent: userAgent,
  }

  // Capture UTMs if enabled
  if (settings?.tracking?.utmEnabled && body.utms) {
    metadata.utm_source = body.utms.utm_source || null
    metadata.utm_medium = body.utms.utm_medium || null
    metadata.utm_campaign = body.utms.utm_campaign || null
    metadata.utm_term = body.utms.utm_term || null
    metadata.utm_content = body.utms.utm_content || null
  }

  const response = await prisma.response.create({
    data: {
      formId: form.id,
      status: 'partial',
      metadata,
    },
  })

  return NextResponse.json({ responseId: response.id }, { status: 201 })
}
