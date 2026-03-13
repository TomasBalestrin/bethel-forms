import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

  const { responseId } = await request.json()

  if (!responseId) {
    return NextResponse.json(
      { error: 'responseId é obrigatório' },
      { status: 400 }
    )
  }

  const response = await prisma.response.findFirst({
    where: { id: responseId, formId: form.id },
  })

  if (!response) {
    return NextResponse.json(
      { error: 'Resposta não encontrada' },
      { status: 404 }
    )
  }

  const startedAt = new Date(response.startedAt)
  const completedAt = new Date()
  const durationSeconds = Math.round(
    (completedAt.getTime() - startedAt.getTime()) / 1000
  )

  const updated = await prisma.response.update({
    where: { id: responseId },
    data: {
      status: 'complete',
      completedAt,
      durationSeconds,
    },
  })

  return NextResponse.json(updated)
}
