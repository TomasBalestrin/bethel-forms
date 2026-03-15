import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()

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

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({ name, email, password_hash })
      .select('id, email, name')
      .single()

    if (error) {
      console.error('Registration error:', error)
      return NextResponse.json(
        { error: 'Erro ao criar conta' },
        { status: 500 }
      )
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: error?.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
