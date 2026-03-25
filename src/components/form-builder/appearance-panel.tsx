'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppearancePanelProps {
  settings: any
  onUpdate: (settings: any) => void
}

const FONT_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Normal' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
]

function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-t border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-3 text-sm font-semibold text-gray-900 uppercase tracking-wide hover:text-blue-600 transition-colors"
      >
        {title}
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {open && <div className="pb-4 space-y-4">{children}</div>}
    </div>
  )
}

function ColorRow({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {hint && <p className="text-[10px] text-gray-400">{hint}</p>}
      <div className="flex gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded cursor-pointer border border-gray-300"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="flex-1" />
      </div>
    </div>
  )
}

export function AppearancePanel({ settings, onUpdate }: AppearancePanelProps) {
  const appearance = settings?.appearance || {}

  function updateAppearance(key: string, value: any) {
    onUpdate({
      ...settings,
      appearance: { ...appearance, [key]: value },
    })
  }

  return (
    <div className="p-4">
      {/* Aparência */}
      <CollapsibleSection title="Aparência" defaultOpen={true}>
        <ColorRow label="Cor principal" value={appearance.primaryColor || '#2563eb'} onChange={(v) => updateAppearance('primaryColor', v)} />
        <ColorRow label="Cor do texto" value={appearance.textColor || '#111827'} onChange={(v) => updateAppearance('textColor', v)} />
        <ColorRow label="Cor da descrição" value={appearance.descriptionColor || '#6b7280'} onChange={(v) => updateAppearance('descriptionColor', v)} />
        <ColorRow label="Cor do placeholder" value={appearance.placeholderColor || '#9ca3af'} onChange={(v) => updateAppearance('placeholderColor', v)} hint="Texto de exemplo nos campos de resposta." />
        <ColorRow label="Cor das opções" value={appearance.optionColor || '#d1d5db'} onChange={(v) => updateAppearance('optionColor', v)} hint="Borda e letras das opções de múltipla escolha." />
        <ColorRow label="Cor de fundo" value={appearance.backgroundColor || '#ffffff'} onChange={(v) => updateAppearance('backgroundColor', v)} />

        {/* Logo */}
        <div className="space-y-1">
          <Label>Logotipo</Label>
          <p className="text-[10px] text-gray-400">Aparece no canto superior esquerdo do formulário.</p>
          {appearance.logoUrl && (
            <div className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-gray-50">
              <img
                src={appearance.logoUrl}
                alt="Logo"
                className="h-8 max-w-[120px] object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              <button
                onClick={() => updateAppearance('logoUrl', '')}
                className="ml-auto text-xs text-red-500 hover:text-red-700"
              >
                Remover
              </button>
            </div>
          )}
          <Input
            value={appearance.logoUrl || ''}
            onChange={(e) => updateAppearance('logoUrl', e.target.value)}
            placeholder="https://exemplo.com/logo.png"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Barra de progresso</Label>
          <select
            value={appearance.progressBar || 'bar'}
            onChange={(e) => updateAppearance('progressBar', e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="bar">Barra horizontal</option>
            <option value="steps">Indicador de passos</option>
            <option value="hidden">Ocultar</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Estilo das bordas</Label>
          <select
            value={appearance.borderStyle || 'rounded'}
            onChange={(e) => updateAppearance('borderStyle', e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="rounded">Arredondado</option>
            <option value="square">Reto</option>
            <option value="pill">Pill</option>
          </select>
        </div>
      </CollapsibleSection>

      {/* Tipografia */}
      <CollapsibleSection title="Tipografia" defaultOpen={false}>
        {/* Title */}
        <div>
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Título</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <div>
              <span className="text-[10px] text-gray-400">Tamanho (px)</span>
              <Input
                type="number"
                value={appearance.titleFontSize || ''}
                onChange={(e) => updateAppearance('titleFontSize', e.target.value || undefined)}
                placeholder="24"
                min={12}
                max={72}
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400">Peso</span>
              <select
                value={appearance.titleFontWeight || '700'}
                onChange={(e) => updateAppearance('titleFontWeight', e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-2 text-sm"
              >
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Descrição</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <div>
              <span className="text-[10px] text-gray-400">Tamanho (px)</span>
              <Input
                type="number"
                value={appearance.descriptionFontSize || ''}
                onChange={(e) => updateAppearance('descriptionFontSize', e.target.value || undefined)}
                placeholder="16"
                min={10}
                max={48}
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400">Peso</span>
              <select
                value={appearance.descriptionFontWeight || '400'}
                onChange={(e) => updateAppearance('descriptionFontWeight', e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-2 text-sm"
              >
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Answer */}
        <div>
          <Label className="text-xs text-gray-500 uppercase tracking-wider">Resposta</Label>
          <div className="grid grid-cols-2 gap-2 mt-1.5">
            <div>
              <span className="text-[10px] text-gray-400">Tamanho (px)</span>
              <Input
                type="number"
                value={appearance.answerFontSize || ''}
                onChange={(e) => updateAppearance('answerFontSize', e.target.value || undefined)}
                placeholder="16"
                min={10}
                max={48}
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-400">Peso</span>
              <select
                value={appearance.answerFontWeight || '400'}
                onChange={(e) => updateAppearance('answerFontWeight', e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-2 text-sm"
              >
                {FONT_WEIGHT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Rastreamento */}
      <CollapsibleSection title="Rastreamento" defaultOpen={false}>
        <div className="space-y-1.5">
          <Label>Meta Pixel ID</Label>
          <Input
            value={settings?.tracking?.pixelId || ''}
            onChange={(e) =>
              onUpdate({ ...settings, tracking: { ...settings?.tracking, pixelId: e.target.value } })
            }
            placeholder="Ex: 123456789012345"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Google Analytics ID</Label>
          <Input
            value={settings?.tracking?.gaId || ''}
            onChange={(e) =>
              onUpdate({ ...settings, tracking: { ...settings?.tracking, gaId: e.target.value } })
            }
            placeholder="Ex: G-XXXXXXXXXX"
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Capturar UTMs</Label>
          <button
            onClick={() =>
              onUpdate({ ...settings, tracking: { ...settings?.tracking, utmEnabled: !settings?.tracking?.utmEnabled } })
            }
            className={`relative w-11 h-6 rounded-full transition-colors ${
              settings?.tracking?.utmEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                settings?.tracking?.utmEnabled ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      </CollapsibleSection>

      {/* Link */}
      <CollapsibleSection title="Link" defaultOpen={false}>
        <div className="space-y-1.5">
          <Label>Slug personalizado</Label>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400 whitespace-nowrap">/</span>
            <Input
              value={settings?._slug || ''}
              onChange={(e) =>
                onUpdate({ ...settings, _slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
              }
              placeholder="meu-formulario"
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
