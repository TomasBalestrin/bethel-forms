import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function PUT(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
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

  const field = await prisma.formField.update({
    where: { id: params.fieldId },
    data: {
      title: data.title,
      description: data.description,
      required: data.required,
      placeholder: data.placeholder,
      settings: data.settings,
      media: data.media,
      logic: data.logic,
      conversionEvent: data.conversionEvent,
      type: data.type,
    },
  })

  return NextResponse.json(field)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; fieldId: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const form = await prisma.form.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  await prisma.formField.delete({ where: { id: params.fieldId } })

  return NextResponse.json({ success: true })
}
