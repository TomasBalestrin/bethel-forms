import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'

export const dynamic = 'force-dynamic'

// Debug endpoint: shows raw DB data for a form's settings
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .select('id, name, slug, status, settings, published_version, updated_at')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !form) {
      return NextResponse.json({ error: 'Not found', details: error }, { status: 404 })
    }

    return NextResponse.json({
      _debug: true,
      id: form.id,
      name: form.name,
      slug: form.slug,
      status: form.status,
      updated_at: form.updated_at,
      settings_raw: form.settings,
      settings_appearance: (form.settings as any)?.appearance || null,
      settings_appearance_keys: Object.keys((form.settings as any)?.appearance || {}),
      published_version_exists: !!form.published_version,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
