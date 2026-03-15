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
  })

  if (!form) {
    return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })
  }

  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')

  const where: any = { formId: params.id }
  if (status) where.status = status

  const [responses, total] = await Promise.all([
    prisma.response.findMany({
      where,
      include: {
        answers: {
          include: { field: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.response.count({ where }),
  ])

  return NextResponse.json({
    responses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
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

  await prisma.response.deleteMany({ where: { formId: params.id } })

  return NextResponse.json({ success: true })
}
