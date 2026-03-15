import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function PATCH(
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

  const { fieldIds } = await request.json()

  // Update order for each field
  const updates = fieldIds.map((fieldId: string, index: number) =>
    prisma.formField.update({
      where: { id: fieldId },
      data: { order: index },
    })
  )

  await prisma.$transaction(updates)

  return NextResponse.json({ success: true })
}
