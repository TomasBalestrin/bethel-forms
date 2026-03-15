import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

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

    // Check if user already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    // PGRST116 = "not found" which is the expected case
    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('[register] lookup error:', lookupError.message, lookupError.code)
      return NextResponse.json(
        { error: `Erro ao verificar email: ${lookupError.message}` },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    // Hash password - dynamic import for bcryptjs v3 compatibility
    const bcryptModule = await import('bcryptjs')
    const bcrypt = bcryptModule.default || bcryptModule
    const password_hash = await bcrypt.hash(password, 12)

    // Insert user
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({ name, email, password_hash })
      .select('id, email, name')
      .single()

    if (insertError) {
      console.error('[register] insert error:', insertError.message, insertError.code, insertError.hint)
      return NextResponse.json(
        { error: `Erro ao criar conta: ${insertError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('[register] exception:', error)
    return NextResponse.json(
      { error: `Erro no servidor: ${error?.message || 'erro desconhecido'}` },
      { status: 500 }
    )
  }
}
