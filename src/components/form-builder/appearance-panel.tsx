'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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

export function AppearancePanel({ settings, onUpdate }: AppearancePanelProps) {
  const appearance = settings?.appearance || {}

  function updateAppearance(key: string, value: any) {
    onUpdate({
      ...settings,
      appearance: { ...appearance, [key]: value },
    })
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        Aparência
      </h3>

      {/* Colors */}
      <div className="space-y-1.5">
        <Label>Cor principal</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={appearance.primaryColor || '#2563eb'}
            onChange={(e) => updateAppearance('primaryColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-gray-300"
          />
          <Input
            value={appearance.primaryColor || '#2563eb'}
            onChange={(e) => updateAppearance('primaryColor', e.target.value)}
            placeholder="#2563eb"
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Cor do texto</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={appearance.textColor || '#111827'}
            onChange={(e) => updateAppearance('textColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-gray-300"
          />
          <Input
            value={appearance.textColor || '#111827'}
            onChange={(e) => updateAppearance('textColor', e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Cor de fundo</Label>
        <div className="flex gap-2">
          <input
            type="color"
            value={appearance.backgroundColor || '#ffffff'}
            onChange={(e) => updateAppearance('backgroundColor', e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border border-gray-300"
          />
          <Input
            value={appearance.backgroundColor || '#ffffff'}
            onChange={(e) => updateAppearance('backgroundColor', e.target.value)}
            className="flex-1"
          />
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

      {/* Typography */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
          Tipografia
        </h3>

        {/* Title */}
        <div className="mb-4">
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
        <div className="mb-4">
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
        <div className="mb-2">
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
      </div>

      {/* Tracking section */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
          Rastreamento
        </h3>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Meta Pixel ID</Label>
            <Input
              value={settings?.tracking?.pixelId || ''}
              onChange={(e) =>
                onUpdate({
                  ...settings,
                  tracking: { ...settings?.tracking, pixelId: e.target.value },
                })
              }
              placeholder="Ex: 123456789012345"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Google Analytics ID</Label>
            <Input
              value={settings?.tracking?.gaId || ''}
              onChange={(e) =>
                onUpdate({
                  ...settings,
                  tracking: { ...settings?.tracking, gaId: e.target.value },
                })
              }
              placeholder="Ex: G-XXXXXXXXXX"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Capturar UTMs</Label>
            <button
              onClick={() =>
                onUpdate({
                  ...settings,
                  tracking: { ...settings?.tracking, utmEnabled: !settings?.tracking?.utmEnabled },
                })
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
        </div>
      </div>

      {/* Slug section */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
          Link
        </h3>
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
      </div>
    </div>
  )
}
