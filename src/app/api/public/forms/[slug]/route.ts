import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { data: form, error } = await supabase
    .from('forms')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (error || !form) {
    return NextResponse.json(
      { error: 'Formulário não encontrado' },
      { status: 404 }
    )
  }

  const publishedVersion = form.published_version as any
  if (!publishedVersion) {
    return NextResponse.json(
      { error: 'Formulário não publicado' },
      { status: 404 }
    )
  }

  const settings = form.settings as any

  return NextResponse.json({
    id: form.id,
    name: form.name,
    slug: form.slug,
    fields: publishedVersion.fields || [],
    appearance: settings?.appearance || {},
    tracking: settings?.tracking || {},
    language: settings?.language || 'pt-BR',
    seo: settings?.seo || {},
  })
}
