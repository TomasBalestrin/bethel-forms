import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const form = await prisma.form.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      fields: { orderBy: { order: 'asc' } },
      _count: { select: { responses: true } },
    },
  })

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  return NextResponse.json(form)
}

export async function PUT(
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

  const updated = await prisma.form.update({
    where: { id: params.id },
    data: {
      name: data.name ?? form.name,
      slug: data.slug ?? form.slug,
      settings: data.settings ?? form.settings,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
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

  await prisma.form.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
