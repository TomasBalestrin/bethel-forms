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

  const [totalResponses, completeResponses, partialResponses] = await Promise.all([
    prisma.response.count({ where: { formId: params.id } }),
    prisma.response.count({ where: { formId: params.id, status: 'complete' } }),
    prisma.response.count({ where: { formId: params.id, status: 'partial' } }),
  ])

  const avgDuration = await prisma.response.aggregate({
    where: { formId: params.id, status: 'complete', durationSeconds: { not: null } },
    _avg: { durationSeconds: true },
  })

  const completionRate = totalResponses > 0
    ? Math.round((completeResponses / totalResponses) * 100)
    : 0

  return NextResponse.json({
    totalResponses,
    completeResponses,
    partialResponses,
    completionRate,
    avgDurationSeconds: Math.round(avgDuration._avg.durationSeconds || 0),
  })
}
