import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const form = await prisma.form.findFirst({
    where: { id: params.id, userId: user.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const publishedVersion = {
    fields: form.fields.map((f) => ({
      id: f.id,
      type: f.type,
      order: f.order,
      title: f.title,
      description: f.description,
      required: f.required,
      placeholder: f.placeholder,
      settings: f.settings,
      media: f.media,
      logic: f.logic,
      conversionEvent: f.conversionEvent,
    })),
  }

  const updated = await prisma.form.update({
    where: { id: params.id },
    data: {
      status: 'published',
      publishedVersion,
    },
  })

  return NextResponse.json(updated)
}
