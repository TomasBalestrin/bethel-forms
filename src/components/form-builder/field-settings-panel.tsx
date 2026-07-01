'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical, Type, Upload, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'
import { getFieldAlignment } from '@/lib/field-alignment'
import type { FieldAlign } from '@/types'

const ALIGN_OPTS: { value: FieldAlign; icon: typeof AlignLeft; label: string }[] = [
  { value: 'left', icon: AlignLeft, label: 'Esquerda' },
  { value: 'center', icon: AlignCenter, label: 'Centro' },
  { value: 'right', icon: AlignRight, label: 'Direita' },
]

function AlignRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: FieldAlign
  onChange: (v: FieldAlign) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        {ALIGN_OPTS.map(({ value: v, icon: Icon, label: l }) => (
          <button
            key={v}
            type="button"
            aria-label={l}
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`p-1.5 rounded border transition-colors ${
              value === v
                ? 'border-blue-300 bg-blue-50 text-blue-600'
                : 'border-gray-200 text-gray-400 hover:bg-gray-50'
            }`}
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
    </div>
  )
}

// Seletor de cor (picker nativo + hex), mesmo padrão do appearance-panel.
function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
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

interface FieldSettingsPanelProps {
  field: any
  onUpdate: (updates: any) => void
  allFields?: any[]
}

export function FieldSettingsPanel({ field, onUpdate, allFields = [] }: FieldSettingsPanelProps) {
  const [uploadingTicket, setUploadingTicket] = useState(false)
  if (!field) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Selecione um campo para editar suas configurações</p>
      </div>
    )
  }

  const settings = field.settings || {}
  const alignment = getFieldAlignment(field)

  function updateSettings(key: string, value: any) {
    onUpdate({ settings: { ...settings, [key]: value } })
  }

  function updateAlignment(key: 'title' | 'description' | 'elements', value: FieldAlign) {
    updateSettings('alignment', { ...(settings.alignment || {}), [key]: value })
  }

  function addOption() {
    const options = settings.options || []
    const newOption = { id: uuidv4(), label: `Opção ${options.length + 1}`, value: `option_${options.length + 1}` }
    updateSettings('options', [...options, newOption])
  }

  function updateOption(index: number, label: string) {
    const options = [...(settings.options || [])]
    options[index] = { ...options[index], label, value: label.toLowerCase().replace(/\s+/g, '_') }
    updateSettings('options', options)
  }

  function removeOption(index: number) {
    const options = (settings.options || []).filter((_: any, i: number) => i !== index)
    updateSettings('options', options)
  }

  function toggleOptionTextInput(index: number) {
    const options = [...(settings.options || [])]
    options[index] = { ...options[index], hasTextInput: !options[index].hasTextInput }
    if (!options[index].hasTextInput) {
      delete options[index].textInputPlaceholder
    }
    updateSettings('options', options)
  }

  function updateOptionPlaceholder(index: number, placeholder: string) {
    const options = [...(settings.options || [])]
    options[index] = { ...options[index], textInputPlaceholder: placeholder }
    updateSettings('options', options)
  }

  function deleteTicketBg(url?: string) {
    if (!url) return
    // best-effort: remove a arte antiga do bucket
    fetch(`/api/forms/${field.formId}/ticket-background`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    }).catch(() => {})
  }

  async function uploadTicketBackground(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem deve ter no máximo 5MB')
      return
    }
    setUploadingTicket(true)
    try {
      const prev = settings.ticketBackgroundUrl
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`/api/forms/${field.formId}/ticket-background`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.url) {
        alert(json.error || 'Erro ao enviar imagem')
        return
      }
      updateSettings('ticketBackgroundUrl', json.url)
      deleteTicketBg(prev)
    } finally {
      setUploadingTicket(false)
    }
  }

  function removeTicketBackground() {
    const prev = settings.ticketBackgroundUrl
    updateSettings('ticketBackgroundUrl', '')
    deleteTicketBg(prev)
  }

  const ticketVerticalOpts: { value: 'top' | 'middle' | 'bottom'; label: string }[] = [
    { value: 'top', label: 'Topo' },
    { value: 'middle', label: 'Meio' },
    { value: 'bottom', label: 'Base' },
  ]

  const ticketLabelPosOpts: { value: 'below' | 'side'; label: string }[] = [
    { value: 'below', label: 'Abaixo' },
    { value: 'side', label: 'Ao lado' },
  ]

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        Configurações
      </h3>

      {/* Title */}
      <div className="space-y-1.5">
        <Label>Título</Label>
        <Input
          value={field.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Título da pergunta"
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Descrição (opcional)</Label>
        <Textarea
          value={field.description || ''}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Texto de ajuda"
          rows={2}
        />
      </div>

      {/* Placeholder - for input fields */}
      {['short_text', 'long_text', 'email', 'phone', 'number'].includes(field.type) && (
        <div className="space-y-1.5">
          <Label>Placeholder</Label>
          <Input
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ placeholder: e.target.value })}
            placeholder="Texto de exemplo"
          />
        </div>
      )}

      {/* Required toggle */}
      {!['welcome', 'thanks', 'message'].includes(field.type) && (
        <div className="flex items-center justify-between">
          <Label>Obrigatório</Label>
          <button
            onClick={() => onUpdate({ required: !field.required })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              field.required ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                field.required ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      )}

      {/* Multiple choice options */}
      {['multiple_choice', 'checkbox'].includes(field.type) && (
        <div className="space-y-2">
          <Label>Opções</Label>
          {(settings.options || []).map((option: any, index: number) => (
            <div key={option.id} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
                <Input
                  value={option.label}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1"
                />
                <button
                  onClick={() => toggleOptionTextInput(index)}
                  title="Campo de texto ao selecionar"
                  className={`p-1 transition-colors ${option.hasTextInput ? 'text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}
                >
                  <Type size={14} />
                </button>
                <button
                  onClick={() => removeOption(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {option.hasTextInput && (
                <div className="ml-6">
                  <Input
                    value={option.textInputPlaceholder || ''}
                    onChange={(e) => updateOptionPlaceholder(index, e.target.value)}
                    placeholder="Placeholder do campo (ex: Qual?)"
                    className="text-xs h-8"
                  />
                </div>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addOption} className="w-full">
            <Plus size={14} className="mr-1" />
            Adicionar opção
          </Button>

          {/* Allow "Other" */}
          <div className="flex items-center justify-between mt-2">
            <Label className="text-xs">Opção "Outro"</Label>
            <button
              onClick={() => updateSettings('allowOther', !settings.allowOther)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.allowOther ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.allowOther ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Satisfaction scale settings */}
      {field.type === 'satisfaction_scale' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Valor mínimo</Label>
              <Input
                type="number"
                value={settings.scaleMin ?? 0}
                onChange={(e) => updateSettings('scaleMin', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor máximo</Label>
              <Input
                type="number"
                value={settings.scaleMax ?? 10}
                onChange={(e) => updateSettings('scaleMax', parseInt(e.target.value) || 10)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Legenda mínimo</Label>
            <Input
              value={settings.scaleMinLabel || ''}
              onChange={(e) => updateSettings('scaleMinLabel', e.target.value)}
              placeholder="Ex: Não recomendo"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Legenda máximo</Label>
            <Input
              value={settings.scaleMaxLabel || ''}
              onChange={(e) => updateSettings('scaleMaxLabel', e.target.value)}
              placeholder="Ex: Recomendo muito"
            />
          </div>
        </div>
      )}

      {/* Thanks field settings */}
      {field.type === 'thanks' && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Tipo de final</Label>
            <select
              value={settings.thanksType || 'message'}
              onChange={(e) => updateSettings('thanksType', e.target.value)}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
            >
              <option value="message">Mensagem simples</option>
              <option value="redirect">Redirecionamento</option>
              <option value="download">Download de arquivo</option>
              <option value="ticket">Ingresso / Ticket</option>
            </select>
          </div>

          {settings.thanksType === 'redirect' && (
            <>
              <div className="space-y-1.5">
                <Label>URL de redirecionamento</Label>
                <Input
                  value={settings.redirectUrl || ''}
                  onChange={(e) => updateSettings('redirectUrl', e.target.value)}
                  placeholder="https://exemplo.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Texto do botão</Label>
                <Input
                  value={settings.buttonText || ''}
                  onChange={(e) => updateSettings('buttonText', e.target.value)}
                  placeholder="Visitar site"
                />
              </div>
            </>
          )}

          {settings.thanksType === 'ticket' && (
            <div className="space-y-3">
              {/* Arte de fundo do ingresso */}
              <div className="space-y-1.5">
                <Label>Arte do ingresso (1080×1440)</Label>
                {settings.ticketBackgroundUrl && (
                  <div className="flex items-center gap-2">
                    <img
                      src={settings.ticketBackgroundUrl}
                      alt="Arte"
                      className="h-16 w-12 object-cover rounded border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={removeTicketBackground}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remover
                    </button>
                  </div>
                )}
                <label className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md cursor-pointer hover:bg-blue-100 transition-colors w-fit">
                  <Upload size={12} />
                  {uploadingTicket
                    ? 'Enviando…'
                    : settings.ticketBackgroundUrl
                    ? 'Trocar arte'
                    : 'Upload da arte'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    disabled={uploadingTicket}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadTicketBackground(file)
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>

              {/* Posição do QR sobre a arte */}
              <div className="space-y-2">
                <Label className="uppercase tracking-wide text-[11px] text-gray-500">
                  Posição do QR
                </Label>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Vertical</Label>
                  <div className="flex gap-1">
                    {ticketVerticalOpts.map(({ value: v, label: l }) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => updateSettings('ticketQrVertical', v)}
                        className={`px-2 py-1 text-xs rounded border transition-colors ${
                          (settings.ticketQrVertical || 'middle') === v
                            ? 'border-blue-300 bg-blue-50 text-blue-600'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <AlignRow
                  label="Horizontal"
                  value={settings.ticketQrHorizontal || 'center'}
                  onChange={(v) => updateSettings('ticketQrHorizontal', v)}
                />
              </div>

              {/* Tamanho do QR */}
              <div className="space-y-1.5">
                <Label>Tamanho do QR (px)</Label>
                <Input
                  type="number"
                  value={settings.ticketQrSize || ''}
                  onChange={(e) =>
                    updateSettings('ticketQrSize', parseInt(e.target.value) || undefined)
                  }
                  placeholder="320"
                />
              </div>

              {/* Campo exibido como texto sob o QR */}
              <div className="space-y-1.5">
                <Label>Campo exibido sob o QR</Label>
                <select
                  value={settings.ticketFieldId || ''}
                  onChange={(e) => updateSettings('ticketFieldId', e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                >
                  <option value="">Nenhum</option>
                  {allFields
                    .filter((f) => !['welcome', 'thanks', 'message'].includes(f.type))
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.title || f.type}
                      </option>
                    ))}
                </select>
              </div>

              {/* Posição do rótulo em relação ao QR */}
              {settings.ticketFieldId && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Posição do texto</Label>
                    <div className="flex gap-1">
                      {ticketLabelPosOpts.map(({ value: v, label: l }) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => updateSettings('ticketLabelPosition', v)}
                          className={`px-2 py-1 text-xs rounded border transition-colors ${
                            (settings.ticketLabelPosition || 'below') === v
                              ? 'border-blue-300 bg-blue-50 text-blue-600'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alinhamento vertical do texto — só no modo "Ao lado" */}
                  {settings.ticketLabelPosition === 'side' && (
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Alinhamento vertical</Label>
                      <div className="flex gap-1">
                        {ticketVerticalOpts.map(({ value: v, label: l }) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => updateSettings('ticketLabelVertical', v)}
                            className={`px-2 py-1 text-xs rounded border transition-colors ${
                              (settings.ticketLabelVertical || 'middle') === v
                                ? 'border-blue-300 bg-blue-50 text-blue-600'
                                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <ColorRow
                    label="Cor do texto"
                    value={settings.ticketTextColor || '#111827'}
                    onChange={(v) => updateSettings('ticketTextColor', v)}
                  />
                </div>
              )}

              {/* Borda do QR (aparece no ingresso baixado) */}
              <div className="space-y-2">
                <Label className="uppercase tracking-wide text-[11px] text-gray-500">
                  Borda do QR
                </Label>
                <ColorRow
                  label="Cor da borda"
                  value={settings.ticketQrBorderColor || '#111827'}
                  onChange={(v) => updateSettings('ticketQrBorderColor', v)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Largura (px)</Label>
                    <Input
                      type="number"
                      value={settings.ticketQrBorderWidth ?? ''}
                      onChange={(e) =>
                        updateSettings('ticketQrBorderWidth', parseInt(e.target.value) || undefined)
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Arredondamento (px)</Label>
                    <Input
                      type="number"
                      value={settings.ticketQrBorderRadius ?? ''}
                      onChange={(e) =>
                        updateSettings('ticketQrBorderRadius', parseInt(e.target.value) || undefined)
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Moldura da imagem final (só na tela, não no download) */}
              <div className="space-y-2">
                <Label className="uppercase tracking-wide text-[11px] text-gray-500">
                  Moldura da imagem
                </Label>
                <ColorRow
                  label="Cor da moldura"
                  value={settings.ticketImageBorderColor || '#e5e7eb'}
                  onChange={(v) => updateSettings('ticketImageBorderColor', v)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Largura (px)</Label>
                    <Input
                      type="number"
                      value={settings.ticketImageBorderWidth ?? ''}
                      onChange={(e) =>
                        updateSettings(
                          'ticketImageBorderWidth',
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Arredondamento (px)</Label>
                    <Input
                      type="number"
                      value={settings.ticketImageBorderRadius ?? ''}
                      onChange={(e) =>
                        updateSettings(
                          'ticketImageBorderRadius',
                          parseInt(e.target.value) || undefined
                        )
                      }
                      placeholder="8"
                    />
                  </div>
                </div>
              </div>

              {/* Texto do botão de download */}
              <div className="space-y-1.5">
                <Label>Texto do botão</Label>
                <Input
                  value={settings.ticketDownloadText || ''}
                  onChange={(e) => updateSettings('ticketDownloadText', e.target.value)}
                  placeholder="Baixar ingresso"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Max length for text fields */}
      {['short_text', 'long_text'].includes(field.type) && (
        <div className="space-y-1.5">
          <Label>Limite de caracteres</Label>
          <Input
            type="number"
            value={settings.maxLength || ''}
            onChange={(e) => updateSettings('maxLength', parseInt(e.target.value) || undefined)}
            placeholder="Sem limite"
          />
        </div>
      )}

      {/* Alignment */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <Label className="uppercase tracking-wide text-[11px] text-gray-500">Alinhamento</Label>
        <AlignRow label="Título" value={alignment.title} onChange={(v) => updateAlignment('title', v)} />
        <AlignRow label="Descrição" value={alignment.description} onChange={(v) => updateAlignment('description', v)} />
        <AlignRow label="Elementos" value={alignment.elements} onChange={(v) => updateAlignment('elements', v)} />
      </div>

      {/* Conversion event toggle */}
      {!['welcome', 'thanks', 'message'].includes(field.type) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div>
            <Label>Evento de conversão</Label>
            <p className="text-xs text-gray-400">Dispara evento Lead (Meta)</p>
          </div>
          <button
            onClick={() => onUpdate({ conversionEvent: !field.conversionEvent })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              field.conversionEvent ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                field.conversionEvent ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
      )}
    </div>
  )
}
