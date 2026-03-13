import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
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

  const publishedVersion = form.publishedVersion as any
  if (!publishedVersion) {
    return NextResponse.json(
      { error: 'Formulário não publicado' },
      { status: 404 }
    )
  }

  const settings = form.settings as any

  return NextResponse.json({
    id: form.id,
    name: form.name,
    slug: form.slug,
    fields: publishedVersion.fields || [],
    appearance: settings?.appearance || {},
    tracking: settings?.tracking || {},
    language: settings?.language || 'pt-BR',
    seo: settings?.seo || {},
  })
}
