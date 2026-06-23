'use client'

import { useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { WebhooksSection } from '@/components/dashboard/webhooks-section'
import { X } from 'lucide-react'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  settings: any
  onUpdate: (partialSettings: any) => void
  formId?: string
}

function Toggle({ value, onChange }: { value?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${value ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-gray-200 pt-8">
      <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
      {hint && <p className="text-sm text-gray-500 mb-6">{hint}</p>}
      <div className="space-y-5">{children}</div>
    </div>
  )
}

export function SettingsModal({ open, onClose, settings, onUpdate, formId }: SettingsModalProps) {
  // Escape fecha + trava scroll do body enquanto aberto
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  const tracking = settings?.tracking || {}
  const seo = settings?.seo || {}
  const notifications = settings?.notifications || {}

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col" role="dialog" aria-modal="true" aria-label="Configurações">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-900">Configurações</h1>
        <button
          onClick={onClose}
          aria-label="Fechar configurações"
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
        >
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
          {/* Link / Slug */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Link</h2>
            <p className="text-sm text-gray-500 mb-6">URL personalizada do formulário.</p>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/
                </span>
                <Input
                  value={settings?._slug ?? settings?.slug ?? ''}
                  onChange={(e) => onUpdate({ _slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="meu-formulario"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Rastreamento */}
          <Section title="Rastreamento" hint="Configure pixels e captura de UTMs.">
            <div className="space-y-1.5">
              <Label>Meta Pixel ID</Label>
              <Input
                value={tracking.pixelId || ''}
                onChange={(e) => onUpdate({ tracking: { pixelId: e.target.value } })}
                placeholder="123456789012345"
              />
              <p className="text-xs text-gray-400">Eventos: PageView, StartForm, SubmitAnswer, EndForm, Lead</p>
            </div>
            <div className="space-y-1.5">
              <Label>Google Analytics (GA4)</Label>
              <Input
                value={tracking.gaId || ''}
                onChange={(e) => onUpdate({ tracking: { gaId: e.target.value } })}
                placeholder="G-XXXXXXXXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Google Tag Manager</Label>
              <Input
                value={tracking.gtmId || ''}
                onChange={(e) => onUpdate({ tracking: { gtmId: e.target.value } })}
                placeholder="GTM-XXXXXXX"
              />
            </div>
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="text-sm font-medium text-gray-700">Captura de UTMs</p>
                <p className="text-xs text-gray-400">utm_source, utm_medium, utm_campaign, etc.</p>
              </div>
              <Toggle value={tracking.utmEnabled} onChange={() => onUpdate({ tracking: { utmEnabled: !tracking.utmEnabled } })} />
            </div>
          </Section>

          {/* SEO */}
          <Section title="SEO e Compartilhamento" hint="Meta tags para redes sociais.">
            <div className="space-y-1.5">
              <Label>Título (og:title)</Label>
              <Input
                value={seo.ogTitle || ''}
                onChange={(e) => onUpdate({ seo: { ogTitle: e.target.value } })}
                placeholder="Título do formulário"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição (og:description)</Label>
              <Input
                value={seo.ogDescription || ''}
                onChange={(e) => onUpdate({ seo: { ogDescription: e.target.value } })}
                placeholder="Descrição do formulário"
              />
            </div>
          </Section>

          {/* Notificações */}
          <Section title="Notificações" hint="Configure alertas por email.">
            <div className="flex items-center justify-between py-1">
              <p className="text-sm font-medium text-gray-700">Email para o dono do formulário</p>
              <Toggle value={notifications.ownerEmail} onChange={() => onUpdate({ notifications: { ownerEmail: !notifications.ownerEmail } })} />
            </div>
            <div className="flex items-center justify-between py-1">
              <p className="text-sm font-medium text-gray-700">Cópia para respondente</p>
              <Toggle value={notifications.respondentCopy} onChange={() => onUpdate({ notifications: { respondentCopy: !notifications.respondentCopy } })} />
            </div>
          </Section>

          {/* Webhooks — persiste via API própria, independente do Publicar */}
          {formId && (
            <div className="border-t border-gray-200 pt-8">
              <WebhooksSection formId={formId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
