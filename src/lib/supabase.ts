import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

function getUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL não está configurada')
  return url
}

function getAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY não está configurada')
  return key
}

// Client for public/client-side usage (respects RLS)
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(getUrl(), getAnonKey())
  }
  return _supabase
}

// Admin client for server-side operations (bypasses RLS with service_role key)
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const key = serviceKey || getAnonKey()

    if (!serviceKey) {
      console.warn('[supabase] SUPABASE_SERVICE_ROLE_KEY não configurada, usando anon key (RLS não será ignorado)')
    }

    _supabaseAdmin = createClient(getUrl(), key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return _supabaseAdmin
}

// Backward compatibility - lazy getters that won't crash at import time
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  },
})

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabaseAdmin() as any)[prop]
  },
})
