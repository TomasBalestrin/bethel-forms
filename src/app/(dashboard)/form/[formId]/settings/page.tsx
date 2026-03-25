'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FormTopBar } from '@/components/dashboard/form-top-bar'
import { Input } from '@/components/ui/input'
import { Save } from 'lucide-react'

export default function FormSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { status: authStatus } = useSession()
  const formId = params.formId as string

  const [form, setForm] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

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
    setSaved(false)
    setSaveError('')
    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          settings: form.settings,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setSaveError(data.error || 'Erro ao salvar')
        setSaving(false)
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError('Erro de conexão')
    }
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  const appearance = form.settings?.appearance || {}

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <FormTopBar
        formId={formId}
        formName={form.name}
        formSlug={form.slug}
        formStatus={form.status}
        saveError={saveError}
        rightActions={
          <button
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Salvando...' : saved ? 'Salvo!' : saveError ? 'Tentar novamente' : 'Salvar'}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Configurações</h1>

          {/* Form Title */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título do formulário:
            </label>
            <div className="relative">
              <Input
                value={form.name}
                onChange={(e) => {
                  if (e.target.value.length <= 60) {
                    setForm({ ...form, name: e.target.value })
                  }
                }}
                className="pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {form.name?.length || 0}/60
              </span>
            </div>
          </div>

          {/* Slug */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL personalizada):
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 whitespace-nowrap">
                {typeof window !== 'undefined' ? window.location.origin : ''}/
              </span>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                className="flex-1"
              />
            </div>
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Personalizar estilo */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Personalizar estilo</h2>
            <p className="text-sm text-gray-500 mb-6">
              Adicione o seu logotipo e cores personalizadas.
            </p>

            <div className="space-y-5">
              {/* Cor do botão */}
              <ColorPickerRow
                label="Cor do botão:"
                value={appearance.primaryColor || '#2563eb'}
                onChange={(val) => updateSettings('appearance.primaryColor', val)}
              />

              {/* Cor da pergunta / texto */}
              <ColorPickerRow
                label="Cor da pergunta:"
                value={appearance.textColor || '#ffffff'}
                onChange={(val) => updateSettings('appearance.textColor', val)}
              />

              {/* Cor da resposta */}
              <ColorPickerRow
                label="Cor da resposta:"
                value={appearance.answerColor || '#ECEFF1'}
                onChange={(val) => updateSettings('appearance.answerColor', val)}
              />

              {/* Cor de fundo */}
              <ColorPickerRow
                label="Cor de fundo:"
                value={appearance.backgroundColor || '#000921'}
                onChange={(val) => updateSettings('appearance.backgroundColor', val)}
              />
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barra de progresso:
            </label>
            <select
              value={appearance.progressBar || 'bar'}
              onChange={(e) => updateSettings('appearance.progressBar', e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="bar">Barra horizontal</option>
              <option value="steps">Indicador de passos</option>
              <option value="hidden">Ocultar</option>
            </select>
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Rastreamento */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Rastreamento</h2>
            <p className="text-sm text-gray-500 mb-6">Configure pixels e captura de UTMs.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Meta Pixel ID:</label>
                <Input
                  value={form.settings?.tracking?.pixelId || ''}
                  onChange={(e) => updateSettings('tracking.pixelId', e.target.value)}
                  placeholder="123456789012345"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Eventos: PageView, StartForm, SubmitAnswer, EndForm, FormFlowConversion
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Analytics (GA4):</label>
                <Input
                  value={form.settings?.tracking?.gaId || ''}
                  onChange={(e) => updateSettings('tracking.gaId', e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Google Tag Manager:</label>
                <Input
                  value={form.settings?.tracking?.gtmId || ''}
                  onChange={(e) => updateSettings('tracking.gtmId', e.target.value)}
                  placeholder="GTM-XXXXXXX"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700">Captura de UTMs</p>
                  <p className="text-xs text-gray-400">Captura utm_source, utm_medium, utm_campaign, etc.</p>
                </div>
                <button
                  onClick={() => updateSettings('tracking.utmEnabled', !form.settings?.tracking?.utmEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.settings?.tracking?.utmEnabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    form.settings?.tracking?.utmEnabled ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* SEO */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-1">SEO e Compartilhamento</h2>
            <p className="text-sm text-gray-500 mb-6">Meta tags para redes sociais.</p>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Título (og:title):</label>
                <Input
                  value={form.settings?.seo?.ogTitle || ''}
                  onChange={(e) => updateSettings('seo.ogTitle', e.target.value)}
                  placeholder={form.name}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (og:description):</label>
                <Input
                  value={form.settings?.seo?.ogDescription || ''}
                  onChange={(e) => updateSettings('seo.ogDescription', e.target.value)}
                  placeholder="Descrição do formulário"
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200 mb-8" />

          {/* Notificações */}
          <div className="mb-12">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Notificações</h2>
            <p className="text-sm text-gray-500 mb-6">Configure alertas por email.</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-gray-700">Email para o dono do formulário</p>
                <button
                  onClick={() => updateSettings('notifications.ownerEmail', !form.settings?.notifications?.ownerEmail)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.settings?.notifications?.ownerEmail ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    form.settings?.notifications?.ownerEmail ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-gray-700">Cópia para respondente</p>
                <button
                  onClick={() => updateSettings('notifications.respondentCopy', !form.settings?.notifications?.respondentCopy)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    form.settings?.notifications?.respondentCopy ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                    form.settings?.notifications?.respondentCopy ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorPickerRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700 w-36 flex-shrink-0">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-200 p-0.5"
        style={{ backgroundColor: value }}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-32"
      />
    </div>
  )
}
