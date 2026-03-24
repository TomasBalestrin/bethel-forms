import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { generateSlug } from '@/lib/utils'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: forms, error } = await supabaseAdmin
      .from('forms')
      .select('*, responses(count)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching forms:', error)
      return NextResponse.json({ error: 'Erro ao buscar formulários' }, { status: 500 })
    }

    const result = (forms || []).map((f: any) => ({
      ...f,
      createdAt: f.created_at,
      _count: { responses: f.responses?.[0]?.count ?? 0 },
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET /api/forms error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
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

    const { data: form, error } = await supabaseAdmin
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
      console.error('Error creating form:', error)
      return NextResponse.json({ error: 'Erro ao criar formulário' }, { status: 500 })
    }

    await supabaseAdmin.from('form_fields').insert([
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
  } catch (error) {
    console.error('POST /api/forms error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
