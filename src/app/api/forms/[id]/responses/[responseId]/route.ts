import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const form = await prisma.form.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const response = await prisma.response.findFirst({
    where: { id: params.responseId, formId: params.id },
    include: {
      answers: {
        include: { field: true },
        orderBy: { field: { order: 'asc' } },
      },
    },
  })

  if (!response) {
    return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 })
  }

  return NextResponse.json(response)
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; responseId: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const form = await prisma.form.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  await prisma.response.delete({ where: { id: params.responseId } })

  return NextResponse.json({ success: true })
}
