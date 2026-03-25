'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save, Copy, ExternalLink } from 'lucide-react'

export default function FormSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { status: authStatus } = useSession()
  const formId = params.formId as string

  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  useEffect(() => {
    fetchForm()
  }, [formId])

  async function fetchForm() {
    const res = await fetch(`/api/forms/${formId}`)
    if (res.ok) setForm(await res.json())
  }

  async function saveSettings() {
    setSaving(true)
    await fetch(`/api/forms/${formId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: form.slug,
        settings: form.settings,
      }),
    })
    setSaving(false)
  }

  function updateSettings(path: string, value: any) {
    const settings = { ...form.settings }
    const keys = path.split('.')
    let obj = settings as any
    for (let i = 0; i < keys.length - 1; i++) {
      if (!obj[keys[i]]) obj[keys[i]] = {}
      obj = obj[keys[i]]
    }
    obj[keys[keys.length - 1]] = value
    setForm({ ...form, settings })
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${form.slug}`

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push(`/form/${formId}/edit`)} className="p-1.5 rounded hover:bg-gray-100">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save size={14} className="mr-1" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Geral</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Nome do formulário</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Link público</Label>
                <div className="flex gap-2">
                  <Input value={publicUrl} readOnly className="bg-gray-50" />
                  <Button variant="outline" onClick={() => navigator.clipboard.writeText(publicUrl)}>
                    <Copy size={14} />
                  </Button>
                  <Button variant="outline" onClick={() => window.open(publicUrl, '_blank')}>
                    <ExternalLink size={14} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Rastreamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Meta Pixel ID</Label>
                <Input
                  value={form.settings?.tracking?.pixelId || ''}
                  onChange={(e) => updateSettings('tracking.pixelId', e.target.value)}
                  placeholder="123456789012345"
                />
                <p className="text-xs text-gray-400">
                  Eventos: PageView, StartForm, SubmitAnswer, EndForm, FormFlowConversion
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Google Analytics (GA4)</Label>
                <Input
                  value={form.settings?.tracking?.gaId || ''}
                  onChange={(e) => updateSettings('tracking.gaId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Google Tag Manager</Label>
                <Input
                  value={form.settings?.tracking?.gtmId || ''}
                  onChange={(e) => updateSettings('tracking.gtmId', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Captura de UTMs</Label>
                  <p className="text-xs text-gray-400">Captura utm_source, utm_medium, etc.</p>
                </div>
                <button
                  onClick={() => updateSettings('tracking.utmEnabled', !form.settings?.tracking?.utmEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.settings?.tracking?.utmEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.settings?.tracking?.utmEnabled ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>SEO e Compartilhamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Título (og:title)</Label>
                <Input
                  value={form.settings?.seo?.ogTitle || ''}
                  onChange={(e) => updateSettings('seo.ogTitle', e.target.value)}
                  placeholder={form.name}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Descrição (og:description)</Label>
                <Input
                  value={form.settings?.seo?.ogDescription || ''}
                  onChange={(e) => updateSettings('seo.ogDescription', e.target.value)}
                  placeholder="Descrição do formulário"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Notificações</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Email para o dono</Label>
                <button
                  onClick={() => updateSettings('notifications.ownerEmail', !form.settings?.notifications?.ownerEmail)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.settings?.notifications?.ownerEmail ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.settings?.notifications?.ownerEmail ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <Label>Cópia para respondente</Label>
                <button
                  onClick={() => updateSettings('notifications.respondentCopy', !form.settings?.notifications?.respondentCopy)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.settings?.notifications?.respondentCopy ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.settings?.notifications?.respondentCopy ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
