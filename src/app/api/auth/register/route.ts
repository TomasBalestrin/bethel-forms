import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL não configurada')
  }

  if (!serviceKey) {
    console.warn(
      'SUPABASE_SERVICE_ROLE_KEY não configurada! Usando anon key como fallback. ' +
      'O registro pode falhar se RLS estiver habilitado na tabela users.'
    )
  }

  const key = serviceKey || anonKey
  if (!key) {
    throw new Error('Nenhuma chave Supabase configurada (SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY)')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Check if user exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 = "not found" which is expected
      console.error('User lookup error:', JSON.stringify(lookupError))
      return NextResponse.json(
        { error: 'Erro ao verificar email. Verifique se a tabela "users" existe no Supabase.' },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({ name, email, password_hash })
      .select('id, email, name')
      .single()

    if (insertError) {
      console.error('Insert error details:', JSON.stringify({
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }))

      let userMessage = 'Erro ao criar conta.'
      if (insertError.code === '42501') {
        userMessage = 'Permissão negada. Verifique as políticas RLS da tabela "users" ou configure a SUPABASE_SERVICE_ROLE_KEY.'
      } else if (insertError.code === '42P01') {
        userMessage = 'Tabela "users" não encontrada. Execute o SQL de setup no Supabase.'
      } else if (insertError.message) {
        userMessage += ` (${insertError.message})`
      }

      return NextResponse.json(
        { error: userMessage },
        { status: 500 }
      )
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Registration exception:', error?.message || error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
