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

  const { format, filters } = await request.json()

  const exportRecord = await prisma.export.create({
    data: {
      formId: params.id,
      userId: user.id,
      format: format || 'csv',
      filters: filters || {},
    },
  })

  // In production, this would trigger an async job
  // For MVP, generate CSV inline
  const responses = await prisma.response.findMany({
    where: { formId: params.id, status: 'complete' },
    include: { answers: { include: { field: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const fields = await prisma.formField.findMany({
    where: { formId: params.id, type: { notIn: ['welcome', 'thanks', 'message'] } },
    orderBy: { order: 'asc' },
  })

  // Build CSV
  const headers = ['Data', ...fields.map((f) => f.title), 'Status', 'UTM Source', 'UTM Medium', 'UTM Campaign']
  const rows = responses.map((r) => {
    const meta = r.metadata as any
    const row = [
      new Date(r.createdAt).toISOString(),
      ...fields.map((f) => {
        const answer = r.answers.find((a) => a.fieldId === f.id)
        const value = answer?.value
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') return JSON.stringify(value)
        return String(value)
      }),
      r.status,
      meta?.utm_source || '',
      meta?.utm_medium || '',
      meta?.utm_campaign || '',
    ]
    return row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')
  })

  const csv = [headers.map((h) => `"${h}"`).join(','), ...rows].join('\n')

  await prisma.export.update({
    where: { id: exportRecord.id },
    data: { status: 'ready', completedAt: new Date() },
  })

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${form.name}.csv"`,
    },
  })
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const exports = await prisma.export.findMany({
    where: { formId: params.id, userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json(exports)
}
