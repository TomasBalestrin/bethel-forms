import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth-helpers'
import { v4 as uuidv4 } from 'uuid'

const BUCKET = 'ticket-assets'
const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const EXT_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

// Confirma que o form pertence ao usuário autenticado. Retorna o user ou null.
async function assertOwner(formId: string) {
  const user = await getAuthenticatedUser()
  if (!user) return { user: null, ok: false }
  const { data: form } = await supabaseAdmin
    .from('forms')
    .select('id')
    .eq('id', formId)
    .eq('user_id', user.id)
    .single()
  return { user, ok: !!form }
}

// POST — upload da arte-fundo do ingresso. Recebe multipart FormData { file }.
// Sobe pro bucket público e devolve { url }.
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, ok } = await assertOwner(params.id)
    if (!user) return unauthorizedResponse()
    if (!ok) return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Arquivo ausente' }, { status: 400 })
    }

    const type = file.type
    const ext = EXT_BY_TYPE[type]
    if (!ext) {
      return NextResponse.json(
        { error: 'Formato inválido — use PNG, JPG ou WEBP' },
        { status: 400 }
      )
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'Imagem deve ter no máximo 5MB' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const path = `${params.id}/${uuidv4()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: type, upsert: false })

    if (uploadError) {
      console.error('Error uploading ticket background:', uploadError)
      return NextResponse.json({ error: 'Erro ao enviar imagem' }, { status: 500 })
    }

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (error) {
    console.error('POST /api/forms/[id]/ticket-background error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE — remove uma arte antiga (ao trocar/remover). Body { url }.
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { user, ok } = await assertOwner(params.id)
    if (!user) return unauthorizedResponse()
    if (!ok) return NextResponse.json({ error: 'Formulário não encontrado' }, { status: 404 })

    const { url } = await request.json().catch(() => ({ url: '' }))
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url ausente' }, { status: 400 })
    }

    // Extrai o path relativo ao bucket a partir da URL pública.
    const marker = `/${BUCKET}/`
    const idx = url.indexOf(marker)
    if (idx === -1) {
      return NextResponse.json({ error: 'url inválida' }, { status: 400 })
    }
    const path = url.slice(idx + marker.length)

    // Só permite apagar objetos deste form (path começa com "{formId}/").
    if (!path.startsWith(`${params.id}/`)) {
      return NextResponse.json({ error: 'Objeto não pertence a este formulário' }, { status: 403 })
    }

    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (error) {
      console.error('Error deleting ticket background:', error)
      return NextResponse.json({ error: 'Erro ao remover imagem' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('DELETE /api/forms/[id]/ticket-background error:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
