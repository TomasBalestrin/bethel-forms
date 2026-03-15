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
  })

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const data = await request.json()

  // Get max order
  const maxOrder = await prisma.formField.aggregate({
    where: { formId: params.id },
    _max: { order: true },
  })

  const field = await prisma.formField.create({
    data: {
      formId: params.id,
      type: data.type,
      order: (maxOrder._max.order ?? -1) + 1,
      title: data.title || '',
      description: data.description,
      required: data.required ?? false,
      placeholder: data.placeholder,
      settings: data.settings || {},
      media: data.media,
      logic: data.logic,
      conversionEvent: data.conversionEvent ?? false,
    },
  })

  return NextResponse.json(field, { status: 201 })
}
