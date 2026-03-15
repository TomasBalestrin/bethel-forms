import { NextResponse } from 'next/server'

// GET endpoint for diagnostics - visit /api/auth/register in browser to check
export async function GET() {
  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    bcryptjs: false,
    supabase_client: false,
    supabase_connection: false,
    supabase_connection_error: null as string | null,
  }

  try {
    const bcrypt = await import('bcryptjs')
    checks.bcryptjs = typeof bcrypt.hash === 'function' || typeof bcrypt.default?.hash === 'function'
  } catch (e: any) {
    checks.bcryptjs = false
  }

  try {
    const { createClient } = await import('@supabase/supabase-js')
    checks.supabase_client = typeof createClient === 'function'

    if (checks.NEXT_PUBLIC_SUPABASE_URL && (checks.SUPABASE_SERVICE_ROLE_KEY || checks.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
        auth: { autoRefreshToken: false, persistSession: false },
      })
      const { error } = await client.from('users').select('id').limit(1)
      if (error) {
        checks.supabase_connection = false
        checks.supabase_connection_error = `${error.code}: ${error.message}`
      } else {
        checks.supabase_connection = true
      }
    }
  } catch (e: any) {
    checks.supabase_client = false
    checks.supabase_connection_error = e?.message || 'unknown error'
  }

  return NextResponse.json({
    status: 'diagnostic',
    checks,
    allOk: Object.entries(checks)
      .filter(([k]) => !k.includes('error'))
      .every(([, v]) => v === true),
  })
}

export async function POST(request: Request) {
  try {
    // Dynamic imports to catch module-level errors
    const bcryptModule = await import('bcryptjs')
    const bcrypt = bcryptModule.default || bcryptModule
    const { createClient } = await import('@supabase/supabase-js')

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

    // Create Supabase client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta: NEXT_PUBLIC_SUPABASE_URL não definida' },
        { status: 500 }
      )
    }

    const key = serviceKey || anonKey
    if (!key) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta: nenhuma chave Supabase configurada' },
        { status: 500 }
      )
    }

    if (!serviceKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY não configurada, usando anon key')
    }

    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Check if user exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (lookupError && lookupError.code !== 'PGRST116') {
      console.error('User lookup error:', JSON.stringify(lookupError))
      return NextResponse.json(
        { error: `Erro ao verificar email: ${lookupError.message} (${lookupError.code})` },
        { status: 500 }
      )
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email já está em uso' },
        { status: 409 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 12)

    // Insert user
    const { data: user, error: insertError } = await supabase
      .from('users')
      .insert({ name, email, password_hash })
      .select('id, email, name')
      .single()

    if (insertError) {
      console.error('Insert error:', JSON.stringify({
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
        hasServiceKey: !!serviceKey,
      }))

      let userMessage = 'Erro ao criar conta'
      if (insertError.code === '42501') {
        userMessage = 'Sem permissão para inserir. Configure SUPABASE_SERVICE_ROLE_KEY ou desabilite RLS na tabela users.'
      } else if (insertError.code === '42P01') {
        userMessage = 'Tabela "users" não existe. Execute o supabase-setup.sql no SQL Editor.'
      } else {
        userMessage += `: ${insertError.message}`
      }

      return NextResponse.json({ error: userMessage }, { status: 500 })
    }

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Registration exception:', error)
    const message = error?.message || String(error) || 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro no registro: ${message}` },
      { status: 500 }
    )
  }
}
