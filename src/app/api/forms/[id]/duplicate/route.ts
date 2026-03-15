import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { generateSlug } from '@/lib/utils'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const original = await prisma.form.findFirst({
    where: { id: params.id, userId: user.id },
    include: { fields: { orderBy: { order: 'asc' } } },
  })

  if (!original) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const newForm = await prisma.form.create({
    data: {
      userId: user.id,
      name: `${original.name} (cópia)`,
      slug: generateSlug(),
      settings: original.settings as any,
      draftVersion: original.draftVersion as any,
    },
  })

  if (original.fields.length > 0) {
    await prisma.formField.createMany({
      data: original.fields.map((f) => ({
        formId: newForm.id,
        type: f.type,
        order: f.order,
        title: f.title,
        description: f.description,
        required: f.required,
        placeholder: f.placeholder,
        settings: f.settings as any,
        media: f.media as any,
        logic: f.logic as any,
        conversionEvent: f.conversionEvent,
      })),
    })
  }

  return NextResponse.json(newForm, { status: 201 })
}
