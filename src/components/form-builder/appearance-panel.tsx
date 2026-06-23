'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronRight, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AppearancePanelProps {
  settings: any
  onUpdate: (settings: any) => void
  formId?: string
}

const FONT_OPTIONS = [
  { value: '', label: 'Padrão do sistema' },
  { value: 'Inter, sans-serif', label: 'Inter' },
  { value: '"Plus Jakarta Sans", sans-serif', label: 'Plus Jakarta Sans' },
  { value: 'Georgia, serif', label: 'Georgia (serifada)' },
  { value: '"Courier New", monospace', label: 'Monoespaçada' },
]

const FONT_SIZE_OPTIONS = [
  { value: '', label: 'Padrão' },
  { value: '15px', label: 'Pequena' },
  { value: '16px', label: 'Média' },
  { value: '18px', label: 'Grande' },
  { value: '20px', label: 'Extra grande' },
]

const BUTTON_RADIUS_OPTIONS = [
  { value: '8px', label: 'Arredondado' },
  { value: '0px', label: 'Reto' },
  { value: '9999px', label: 'Pill' },
]

const BUTTON_SIZE_OPTIONS = [
  { value: 'sm', label: 'Pequeno' },
  { value: 'md', label: 'Médio' },
  { value: 'lg', label: 'Grande' },
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

  // Send ONLY the changed key — the parent deep-merges into latest state
  function updateAppearance(key: string, value: any) {
    onUpdate({ appearance: { [key]: value } })
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
          <div className="flex gap-2">
            <Input
              value={appearance.logoUrl || ''}
              onChange={(e) => updateAppearance('logoUrl', e.target.value)}
              placeholder="URL ou faça upload"
              className="flex-1"
            />
            <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors whitespace-nowrap">
              <Upload size={12} />
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  if (file.size > 2 * 1024 * 1024) {
                    alert('Imagem deve ter no máximo 2MB')
                    return
                  }
                  const reader = new FileReader()
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      updateAppearance('logoUrl', reader.result)
                    }
                  }
                  reader.readAsDataURL(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
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
        <div className="space-y-1.5">
          <Label>Família da fonte</Label>
          <select
            value={appearance.fontFamily || ''}
            onChange={(e) => updateAppearance('fontFamily', e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            {FONT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Tamanho base do texto</Label>
          <select
            value={appearance.baseFontSize || ''}
            onChange={(e) => updateAppearance('baseFontSize', e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            {FONT_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </CollapsibleSection>

      {/* Botão */}
      <CollapsibleSection title="Botão" defaultOpen={false}>
        <ColorRow
          label="Cor do botão"
          value={appearance.buttonColor || appearance.primaryColor || '#2563eb'}
          onChange={(v) => updateAppearance('buttonColor', v)}
          hint="Cor de fundo dos botões de avançar/enviar."
        />
        <ColorRow
          label="Cor do texto do botão"
          value={appearance.buttonTextColor || '#ffffff'}
          onChange={(v) => updateAppearance('buttonTextColor', v)}
        />
        <div className="space-y-1.5">
          <Label>Formato do botão</Label>
          <select
            value={appearance.buttonRadius || '8px'}
            onChange={(e) => updateAppearance('buttonRadius', e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            {BUTTON_RADIUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label>Tamanho do botão</Label>
          <select
            value={appearance.buttonSize || 'md'}
            onChange={(e) => updateAppearance('buttonSize', e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            {BUTTON_SIZE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </CollapsibleSection>
    </div>
  )
}
