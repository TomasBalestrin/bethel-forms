'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormTopBar } from '@/components/dashboard/form-top-bar'
import { FieldTypeSelector } from '@/components/form-builder/field-type-selector'
import { FieldSettingsPanel } from '@/components/form-builder/field-settings-panel'
import { FieldPreview } from '@/components/form-builder/field-preview'
import { AppearancePanel } from '@/components/form-builder/appearance-panel'
import {
  Plus,
  Save,
  Trash2,
  Palette,
  Settings,
  Copy,
  Settings2,
  Image,
} from 'lucide-react'

const FIELD_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  welcome: { label: 'Boas-vindas', color: 'bg-emerald-100 text-emerald-700' },
  short_text: { label: 'Resposta curta', color: 'bg-blue-100 text-blue-700' },
  email: { label: 'Email', color: 'bg-green-100 text-green-700' },
  phone: { label: 'Telefone', color: 'bg-orange-100 text-orange-700' },
  number: { label: 'Numero', color: 'bg-teal-100 text-teal-700' },
  multiple_choice: { label: 'Multipla escolha', color: 'bg-indigo-100 text-indigo-700' },
  satisfaction_scale: { label: 'Escala NPS', color: 'bg-yellow-100 text-yellow-700' },
  message: { label: 'Mensagem', color: 'bg-purple-100 text-purple-700' },
  thanks: { label: 'Agradecimento', color: 'bg-red-100 text-red-700' },
  long_text: { label: 'Resposta longa', color: 'bg-cyan-100 text-cyan-700' },
  checkbox: { label: 'Checkbox', color: 'bg-violet-100 text-violet-700' },
  dropdown: { label: 'Dropdown', color: 'bg-rose-100 text-rose-700' },
  date: { label: 'Data', color: 'bg-amber-100 text-amber-700' },
  url: { label: 'URL', color: 'bg-sky-100 text-sky-700' },
}

export default function FormEditorPage() {
  const router = useRouter()
  const params = useParams()
  const { status: authStatus } = useSession()
  const formId = params.formId as string

  const [form, setForm] = useState<any>(null)
  const [fields, setFields] = useState<any[]>([])
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showFieldSelector, setShowFieldSelector] = useState(false)
  const [rightPanel, setRightPanel] = useState<'settings' | 'appearance'>('settings')
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [publishError, setPublishError] = useState('')
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)
  const isSaving = useRef(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === 'authenticated') fetchForm()
  }, [formId, authStatus])

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    }
  }, [])

  async function fetchForm() {
    try {
      const res = await fetch(`/api/forms/${formId}`)
      if (res.ok) {
        const data = await res.json()
        setForm(data)
        setFields(data.fields || [])
        if (!selectedFieldId && data.fields?.length > 0) {
          setSelectedFieldId(data.fields[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching form:', error)
    }
  }

  const scheduleAutoSave = useCallback(() => {
    setHasChanges(true)
    setSaveError('')
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      saveForm()
    }, 2000)
  }, [formId])

  async function saveForm(): Promise<boolean> {
    if (!form || isSaving.current) return false
    isSaving.current = true
    setSaving(true)
    setSaveError('')

    try {
      const formRes = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.settings?._slug || form.slug,
          settings: form.settings,
        }),
      })

      if (!formRes.ok) {
        const err = await formRes.json().catch(() => ({}))
        setSaveError(err.error || 'Erro ao salvar formulário')
        return false
      }

      const updatedFields = [...fields]
      for (let i = 0; i < updatedFields.length; i++) {
        const field = updatedFields[i]
        if (field._isNew) {
          const res = await fetch(`/api/forms/${formId}/fields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...field, order: i }),
          })
          if (res.ok) {
            const saved = await res.json()
            if (selectedFieldId === field.id) {
              setSelectedFieldId(saved.id)
            }
            updatedFields[i] = { ...field, ...saved, _isNew: undefined }
          } else {
            const err = await res.json().catch(() => ({}))
            setSaveError(err.error || 'Erro ao criar campo')
            return false
          }
        } else {
          await fetch(`/api/forms/${formId}/fields/${field.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...field, order: i }),
          })
        }
      }

      setFields(updatedFields)
      setHasChanges(false)
      return true
    } catch (error) {
      console.error('Error saving:', error)
      setSaveError('Erro de conexão ao salvar')
      return false
    } finally {
      setSaving(false)
      isSaving.current = false
    }
  }

  async function publishForm() {
    setPublishing(true)
    setPublishError('')

    const saved = await saveForm()
    if (!saved) {
      setPublishing(false)
      return
    }

    try {
      const res = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setPublishError(data.error || 'Erro ao publicar')
      } else {
        setForm({ ...form, status: data.status })
        setPublishError('')
      }
    } catch (error) {
      console.error('Error publishing:', error)
      setPublishError('Erro de conexão ao publicar')
    }
    setPublishing(false)
  }

  function addField(type: string) {
    const newField = {
      id: `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      _isNew: true,
      formId,
      type,
      order: fields.length,
      title: '',
      description: '',
      required: false,
      placeholder: '',
      settings:
        type === 'multiple_choice'
          ? { options: [{ id: '1', label: 'Opção 1', value: 'option_1' }, { id: '2', label: 'Opção 2', value: 'option_2' }] }
          : type === 'satisfaction_scale'
            ? { scaleMin: 0, scaleMax: 10 }
            : type === 'thanks'
              ? { thanksType: 'message' }
              : {},
      conversionEvent: false,
    }

    const thanksIndex = fields.findIndex((f) => f.type === 'thanks')
    if (thanksIndex > -1 && type !== 'thanks') {
      const updated = [...fields]
      updated.splice(thanksIndex, 0, newField)
      setFields(updated.map((f, i) => ({ ...f, order: i })))
    } else {
      setFields([...fields, { ...newField, order: fields.length }])
    }

    setSelectedFieldId(newField.id)
    setShowFieldSelector(false)
    scheduleAutoSave()
  }

  function updateField(fieldId: string, updates: any) {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
    scheduleAutoSave()
  }

  async function deleteField(fieldId: string) {
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return
    if (field.type === 'welcome' || field.type === 'thanks') return

    if (!field._isNew) {
      await fetch(`/api/forms/${formId}/fields/${fieldId}`, { method: 'DELETE' })
    }

    const updated = fields.filter((f) => f.id !== fieldId).map((f, i) => ({ ...f, order: i }))
    setFields(updated)

    if (selectedFieldId === fieldId) {
      setSelectedFieldId(updated[0]?.id || null)
    }
  }

  function moveField(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= fields.length) return
    const updated = [...fields]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    setFields(updated.map((f, i) => ({ ...f, order: i })))
    scheduleAutoSave()
  }

  const selectedField = fields.find((f) => f.id === selectedFieldId)

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <FormTopBar
        formId={formId}
        formName={form.name}
        formSlug={form.slug}
        formStatus={form.status}
        onPublish={publishForm}
        publishing={publishing}
        saving={saving}
        hasChanges={hasChanges}
        saveError={saveError || publishError}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Field List */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-y-auto">
            {fields.map((field, index) => {
              const typeInfo = FIELD_TYPE_LABELS[field.type] || { label: field.type, color: 'bg-gray-100 text-gray-600' }
              const isProtected = field.type === 'welcome' || field.type === 'thanks'
              const isSelected = selectedFieldId === field.id

              return (
                <div
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={cn(
                    'flex items-start gap-3 px-4 py-3 cursor-pointer border-l-2 transition-colors group',
                    isSelected
                      ? 'bg-blue-50/60 border-l-blue-500'
                      : 'border-l-transparent hover:bg-gray-50'
                  )}
                >
                  <span className="text-xs text-gray-400 font-medium mt-0.5 w-4 text-right flex-shrink-0">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate leading-snug">
                      {field.title || `${typeInfo.label} (sem título)`}
                    </p>
                    <span className={cn('inline-block text-[10px] font-medium px-1.5 py-0.5 rounded mt-1', typeInfo.color)}>
                      {typeInfo.label}
                    </span>
                  </div>
                  {isSelected && !isProtected && (
                    <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteField(field.id) }}
                        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add field button */}
          <div className="p-3 border-t border-gray-100">
            <button
              onClick={() => setShowFieldSelector(true)}
              className="flex items-center justify-center gap-2 w-full py-2 text-sm text-gray-500 rounded-lg border border-dashed border-gray-300 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
            >
              <Plus size={14} />
              Adicionar campo
            </button>
          </div>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Field type indicator + actions */}
          {selectedField && (
            <div className="flex items-center justify-between px-6 py-2 bg-white border-b border-gray-100">
              <div>
                <span className={cn(
                  'inline-flex items-center text-xs font-medium px-3 py-1 rounded-full',
                  FIELD_TYPE_LABELS[selectedField.type]?.color || 'bg-gray-100 text-gray-600'
                )}>
                  {FIELD_TYPE_LABELS[selectedField.type]?.label || selectedField.type}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRightPanel('settings')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
                    rightPanel === 'settings'
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <Settings2 size={12} />
                  Opções
                </button>
                <button
                  onClick={() => setRightPanel('appearance')}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors',
                    rightPanel === 'appearance'
                      ? 'border-blue-200 bg-blue-50 text-blue-600'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  )}
                >
                  <Palette size={12} />
                  Design
                </button>
              </div>
            </div>
          )}

          <div
            className="flex-1 flex items-center justify-center overflow-y-auto"
            style={{ backgroundColor: form.settings?.appearance?.backgroundColor || '#ffffff' }}
          >
            <FieldPreview
              field={selectedField}
              appearance={form.settings?.appearance}
            />
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex-1 overflow-y-auto">
            {rightPanel === 'settings' ? (
              <FieldSettingsPanel
                field={selectedField}
                onUpdate={(updates) => {
                  if (selectedFieldId) updateField(selectedFieldId, updates)
                }}
              />
            ) : (
              <AppearancePanel
                settings={form.settings}
                onUpdate={(newSettings) => {
                  setForm({ ...form, settings: newSettings })
                  scheduleAutoSave()
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Field Type Selector Modal */}
      {showFieldSelector && (
        <FieldTypeSelector
          onSelect={addField}
          onClose={() => setShowFieldSelector(false)}
        />
      )}
    </div>
  )
}
