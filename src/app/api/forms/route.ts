import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { generateSlug } from '@/lib/utils'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { data: forms, error } = await supabase
    .from('forms')
    .select('*, responses(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar formulários' }, { status: 500 })
  }

  const result = (forms || []).map((f: any) => ({
    ...f,
    _count: { responses: f.responses?.[0]?.count ?? 0 },
  }))

  return NextResponse.json(result)
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

  const { data: form, error } = await supabase
    .from('forms')
    .insert({
      user_id: user.id,
      name: name || 'Novo Formulário',
      slug,
      settings: defaultSettings,
      draft_version: { fields: [] },
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Erro ao criar formulário' }, { status: 500 })
  }

  await supabase.from('form_fields').insert([
    {
      form_id: form.id,
      type: 'welcome',
      order: 0,
      title: 'Bem-vindo!',
      description: 'Preencha o formulário abaixo',
      settings: {},
    },
    {
      form_id: form.id,
      type: 'thanks',
      order: 1,
      title: 'Obrigado!',
      description: 'Suas respostas foram enviadas com sucesso.',
      settings: { thanksType: 'message' },
    },
  ])

  return NextResponse.json(form, { status: 201 })
}
