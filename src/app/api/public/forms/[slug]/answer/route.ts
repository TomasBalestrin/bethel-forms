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

  const { responseId, fieldId, value } = await request.json()

  if (!responseId || !fieldId) {
    return NextResponse.json(
      { error: 'responseId e fieldId são obrigatórios' },
      { status: 400 }
    )
  }

  // Check response exists
  const response = await prisma.response.findFirst({
    where: { id: responseId, formId: form.id },
  })

  if (!response) {
    return NextResponse.json(
      { error: 'Resposta não encontrada' },
      { status: 404 }
    )
  }

  // Upsert the answer (update if already answered, create if new)
  const existingAnswer = await prisma.responseAnswer.findFirst({
    where: { responseId, fieldId },
  })

  let answer
  if (existingAnswer) {
    answer = await prisma.responseAnswer.update({
      where: { id: existingAnswer.id },
      data: { value, answeredAt: new Date() },
    })
  } else {
    answer = await prisma.responseAnswer.create({
      data: {
        responseId,
        fieldId,
        value,
      },
    })
  }

  return NextResponse.json(answer)
}
