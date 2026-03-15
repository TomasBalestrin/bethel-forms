import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { generateSlug } from '@/lib/utils'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const forms = await prisma.form.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(forms)
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { name } = await request.json()

  const slug = generateSlug()

  const defaultSettings = {
    appearance: {
      primaryColor: '#2563eb',
      textColor: '#111827',
      backgroundColor: '#ffffff',
      borderStyle: 'rounded',
      progressBar: 'bar',
    },
    seo: {},
    tracking: { utmEnabled: false },
    notifications: { ownerEmail: true },
    language: 'pt-BR',
  }

  const form = await prisma.form.create({
    data: {
      userId: user.id,
      name: name || 'Novo Formulário',
      slug,
      settings: defaultSettings,
      draftVersion: { fields: [] },
    },
  })

  // Create default welcome and thanks fields
  await prisma.formField.createMany({
    data: [
      {
        formId: form.id,
        type: 'welcome',
        order: 0,
        title: 'Bem-vindo!',
        description: 'Preencha o formulário abaixo',
        settings: {},
      },
      {
        formId: form.id,
        type: 'thanks',
        order: 1,
        title: 'Obrigado!',
        description: 'Suas respostas foram enviadas com sucesso.',
        settings: { thanksType: 'message' },
      },
    ],
  })

  return NextResponse.json(form, { status: 201 })
}
