'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FieldTypeSelector } from '@/components/form-builder/field-type-selector'
import { FieldSettingsPanel } from '@/components/form-builder/field-settings-panel'
import { FieldPreview } from '@/components/form-builder/field-preview'
import { AppearancePanel } from '@/components/form-builder/appearance-panel'
import {
  ArrowLeft,
  Plus,
  Eye,
  Save,
  Send,
  GripVertical,
  Trash2,
  Palette,
  Settings,
  Type,
  Mail,
  Phone,
  ListChecks,
  Star,
  MessageSquare,
  Hand,
  Heart,
} from 'lucide-react'

const FIELD_ICONS: Record<string, any> = {
  welcome: Hand,
  short_text: Type,
  email: Mail,
  phone: Phone,
  multiple_choice: ListChecks,
  satisfaction_scale: Star,
  message: MessageSquare,
  thanks: Heart,
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

  // Cleanup autosave timer on unmount
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

  // Debounced autosave
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
      // 1. Save form settings
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

      // 2. Save fields - create new ones first, then update existing
      const updatedFields = [...fields]
      for (let i = 0; i < updatedFields.length; i++) {
        const field = updatedFields[i]
        if (field._isNew) {
          const res = await fetch(`/api/forms/${formId}/fields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...field,
              order: i,
            }),
          })
          if (res.ok) {
            const saved = await res.json()
            // Update the field with server-assigned ID
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
            body: JSON.stringify({
              ...field,
              order: i,
            }),
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

    // Save first to ensure all changes are persisted
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
          ? {
              options: [
                { id: '1', label: 'Opção 1', value: 'option_1' },
                { id: '2', label: 'Opção 2', value: 'option_2' },
              ],
            }
          : type === 'satisfaction_scale'
            ? { scaleMin: 0, scaleMax: 10 }
            : type === 'thanks'
              ? { thanksType: 'message' }
              : {},
      conversionEvent: false,
    }

    // Insert before the last "thanks" field if it exists
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

    // Don't allow deleting welcome or thanks
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/dash')} className="p-1.5 rounded hover:bg-gray-100">
            <ArrowLeft size={18} />
          </button>
          <Input
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value })
              scheduleAutoSave()
            }}
            className="border-none shadow-none text-base font-semibold w-64 focus:ring-0"
          />
          {form.status === 'published' && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publicado</span>
          )}
          {form.status === 'draft' && (
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Rascunho</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {saving && <span className="text-xs text-gray-400">Salvando...</span>}
          {hasChanges && !saving && <span className="text-xs text-yellow-500">Alterações não salvas</span>}
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          {publishError && <span className="text-xs text-red-500">{publishError}</span>}
          <Button variant="outline" size="sm" onClick={saveForm} disabled={saving}>
            <Save size={14} className="mr-1" />
            Salvar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (form.slug) {
                window.open(`/${form.slug}`, '_blank')
              } else {
                alert('Salve o formulário primeiro para visualizar.')
              }
            }}
          >
            <Eye size={14} className="mr-1" />
            Preview
          </Button>
          <Button size="sm" onClick={publishForm} disabled={publishing || saving}>
            <Send size={14} className="mr-1" />
            {publishing ? 'Publicando...' : 'Publicar'}
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Field List */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-3 border-b border-gray-200">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowFieldSelector(true)}
            >
              <Plus size={14} className="mr-1" />
              Adicionar campo
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {fields.map((field, index) => {
              const Icon = FIELD_ICONS[field.type] || Type
              const isProtected = field.type === 'welcome' || field.type === 'thanks'
              return (
                <div
                  key={field.id}
                  onClick={() => setSelectedFieldId(field.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group text-sm',
                    selectedFieldId === field.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-transparent'
                  )}
                >
                  <GripVertical size={14} className="text-gray-300 flex-shrink-0 cursor-grab" />
                  <Icon size={14} className="text-gray-400 flex-shrink-0" />
                  <span className="flex-1 truncate text-gray-700">
                    {field.title || `${field.type} (sem título)`}
                  </span>
                  {!isProtected && (
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteField(field.id)
                        }}
                        className="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Center - Preview */}
        <div
          className="flex-1 flex items-center justify-center overflow-y-auto"
          style={{ backgroundColor: form.settings?.appearance?.backgroundColor || '#ffffff' }}
        >
          <FieldPreview
            field={selectedField}
            primaryColor={form.settings?.appearance?.primaryColor}
          />
        </div>

        {/* Right Panel */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setRightPanel('settings')}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5',
                rightPanel === 'settings'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Settings size={14} />
              Campo
            </button>
            <button
              onClick={() => setRightPanel('appearance')}
              className={cn(
                'flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5',
                rightPanel === 'appearance'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Palette size={14} />
              Design
            </button>
          </div>

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
