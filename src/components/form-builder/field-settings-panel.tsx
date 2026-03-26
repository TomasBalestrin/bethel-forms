'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface FieldSettingsPanelProps {
  field: any
  onUpdate: (updates: any) => void
}

export function FieldSettingsPanel({ field, onUpdate }: FieldSettingsPanelProps) {
  if (!field) {
    return (
      <div className="p-6 text-center text-gray-400">
        <p>Selecione um campo para editar suas configurações</p>
      </div>
    )
  }

  const settings = field.settings || {}

  function updateSettings(key: string, value: any) {
    onUpdate({ settings: { ...settings, [key]: value } })
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
            <div key={option.id} className="flex items-center gap-2">
              <GripVertical size={14} className="text-gray-300 flex-shrink-0" />
              <Input
                value={option.label}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1"
              />
              <button
                onClick={() => removeOption(index)}
                className="p-1 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
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
                onChange={(e) => updateSettings('scaleMin', parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Valor máximo</Label>
              <Input
                type="number"
                value={settings.scaleMax ?? 10}
                onChange={(e) => updateSettings('scaleMax', parseInt(e.target.value))}
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

      {/* Conversion event toggle */}
      {!['welcome', 'thanks', 'message'].includes(field.type) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
          <div>
            <Label>Evento de conversão</Label>
            <p className="text-xs text-gray-400">Dispara FormFlowConversion</p>
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
