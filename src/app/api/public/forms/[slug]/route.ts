import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { data: form, error } = await supabaseAdmin
      .from('forms')
      .select('*')
      .eq('slug', params.slug)
      .single()

    if (error || !form) {
      return NextResponse.json(
        { error: 'Formulário não encontrado' },
        { status: 404 }
      )
    }

    const settings = form.settings as any
    const publishedVersion = form.published_version as any

    // Use published version if available, otherwise load draft fields for preview
    let fields: any[] = []
    if (publishedVersion?.fields) {
      fields = publishedVersion.fields
    } else {
      // Load draft fields directly from database (preview mode)
      const { data: draftFields } = await supabaseAdmin
        .from('form_fields')
        .select('*')
        .eq('form_id', form.id)
        .order('order', { ascending: true })

      fields = (draftFields || []).map((f: any) => ({
        id: f.id,
        type: f.type,
        title: f.title,
        description: f.description,
        placeholder: f.placeholder,
        required: f.required,
        settings: f.settings || {},
        media: f.media,
        conversionEvent: f.conversion_event,
      }))
    }

    return NextResponse.json({
      id: form.id,
      name: form.name,
      slug: form.slug,
      status: form.status,
      fields,
      appearance: settings?.appearance || {},
      tracking: settings?.tracking || {},
      language: settings?.language || 'pt-BR',
      seo: settings?.seo || {},
    })
  } catch (error) {
    console.error('GET /api/public/forms/[slug] error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
