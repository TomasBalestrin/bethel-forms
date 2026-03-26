'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { FormTopBar } from '@/components/dashboard/form-top-bar'
import { FieldTypeSelector } from '@/components/form-builder/field-type-selector'
import { FieldSettingsPanel } from '@/components/form-builder/field-settings-panel'
import { FieldPreview } from '@/components/form-builder/field-preview'
import { AppearancePanel } from '@/components/form-builder/appearance-panel'
import {
  Plus,
  Trash2,
  Palette,
  Settings2,
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
  const [originalFieldIds, setOriginalFieldIds] = useState<Set<string>>(new Set())
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [showFieldSelector, setShowFieldSelector] = useState(false)
  const [rightPanel, setRightPanel] = useState<'settings' | 'appearance'>('settings')
  const [publishing, setPublishing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [publishError, setPublishError] = useState('')

  // LIVE snapshot — updated SYNCHRONOUSLY, never depends on React render cycle
  const live = useRef<{ form: any; fields: any[]; originalFieldIds: Set<string> }>({
    form: null,
    fields: [],
    originalFieldIds: new Set(),
  })

  // Helper: update form state + live snapshot at the same time
  function updateForm(updater: any) {
    if (typeof updater === 'function') {
      const next = updater(live.current.form)
      live.current.form = next
      setForm(next)
    } else {
      live.current.form = updater
      setForm(updater)
    }
  }
  function updateFields(updater: any) {
    if (typeof updater === 'function') {
      const next = updater(live.current.fields)
      live.current.fields = next
      setFields(next)
    } else {
      live.current.fields = updater
      setFields(updater)
    }
  }
  function updateOriginalFieldIds(val: Set<string>) {
    live.current.originalFieldIds = val
    setOriginalFieldIds(val)
  }

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  useEffect(() => {
    if (authStatus === 'authenticated') fetchForm()
  }, [formId, authStatus])

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  async function fetchForm() {
    try {
      const res = await fetch(`/api/forms/${formId}?t=${Date.now()}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        updateForm(data)
        updateFields(data.fields || [])
        updateOriginalFieldIds(new Set((data.fields || []).map((f: any) => f.id)))
        setHasChanges(false)
        if (!selectedFieldId && data.fields?.length > 0) {
          setSelectedFieldId(data.fields[0].id)
        }
      }
    } catch (error) {
      console.error('Error fetching form:', error)
    }
  }

  // =============================================
  // ALL EDITS ARE LOCAL — no API calls until publish
  // =============================================

  function markChanged() {
    setHasChanges(true)
    setPublishError('')
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

    updateFields((prev: any[]) => {
      const thanksIndex = prev.findIndex((f) => f.type === 'thanks')
      if (thanksIndex > -1 && type !== 'thanks') {
        const updated = [...prev]
        updated.splice(thanksIndex, 0, newField)
        return updated.map((f, i) => ({ ...f, order: i }))
      } else {
        return [...prev, { ...newField, order: prev.length }]
      }
    })

    setSelectedFieldId(newField.id)
    setShowFieldSelector(false)
    markChanged()
  }

  function updateField(fieldId: string, updates: any) {
    updateFields((prev: any[]) => prev.map((f: any) => (f.id === fieldId ? { ...f, ...updates } : f)))
    markChanged()
  }

  function deleteField(fieldId: string) {
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return
    if (field.type === 'welcome' || field.type === 'thanks') return

    updateFields((prev: any[]) => {
      const updated = prev.filter((f: any) => f.id !== fieldId).map((f: any, i: number) => ({ ...f, order: i }))
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(updated[0]?.id || null)
      }
      return updated
    })
    markChanged()
  }

  function moveField(fromIndex: number, toIndex: number) {
    updateFields((prev: any[]) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev
      const updated = [...prev]
      const [moved] = updated.splice(fromIndex, 1)
      updated.splice(toIndex, 0, moved)
      return updated.map((f: any, i: number) => ({ ...f, order: i }))
    })
    markChanged()
  }

  // =============================================
  // PUBLISH: saves everything to DB then publishes
  // =============================================

  async function publishForm() {
    setPublishing(true)
    setPublishError('')

    // Read LIVE snapshot — always has the latest values, no React timing dependency
    const latestForm = live.current.form
    const latestFields = live.current.fields

    if (!latestForm) {
      setPublishError('Formulário não carregado')
      setPublishing(false)
      return
    }

    // Build ordered list with explicit order index
    const orderedFields = latestFields.map((f: any, i: number) => ({ ...f, order: i }))

    try {
      // 1. Save form settings
      const settingsPayload = {
        name: latestForm.name,
        slug: latestForm.settings?._slug || latestForm.slug,
        settings: latestForm.settings,
      }
      console.log('[PUBLISH] Settings keys:', Object.keys(settingsPayload.settings || {}))
      console.log('[PUBLISH] Appearance keys:', Object.keys(settingsPayload.settings?.appearance || {}))
      console.log('[PUBLISH] Appearance:', JSON.stringify(settingsPayload.settings?.appearance))

      const formRes = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload),
      })
      if (!formRes.ok) {
        const err = await formRes.json().catch(() => ({}))
        setPublishError(err.error || 'Erro ao salvar formulário')
        setPublishing(false)
        return
      }

      // 2. Create new fields FIRST (sequential — need server IDs)
      //    Done before deletes so a mid-publish failure doesn't leave orphaned deletes
      const idMapping: Record<string, string> = {}
      for (const field of orderedFields) {
        if (field._isNew) {
          const res = await fetch(`/api/forms/${formId}/fields`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...field }),
          })
          if (res.ok) {
            const saved = await res.json()
            idMapping[field.id] = saved.id
          } else {
            const err = await res.json().catch(() => ({}))
            setPublishError(err.error || 'Erro ao criar campo')
            setPublishing(false)
            return
          }
        }
      }

      // 3. Update existing fields (parallel)
      const existingFields = orderedFields.filter(f => !f._isNew)
      if (existingFields.length > 0) {
        const results = await Promise.all(
          existingFields.map(field =>
            fetch(`/api/forms/${formId}/fields/${field.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...field }),
            }).then(r => ({ ok: r.ok })).catch(() => ({ ok: false }))
          )
        )
        const failed = results.filter(r => !r.ok).length
        if (failed > 0) {
          setPublishError(`Erro ao salvar ${failed} campo(s)`)
          setPublishing(false)
          return
        }
      }

      // 4. Delete removed fields LAST (safe — creates/updates already succeeded)
      const currentFieldIds = new Set(latestFields.map((f: any) => f.id))
      const deletedIds = Array.from(live.current.originalFieldIds).filter(id => !currentFieldIds.has(id))
      if (deletedIds.length > 0) {
        await Promise.all(
          deletedIds.map(id =>
            fetch(`/api/forms/${formId}/fields/${id}`, { method: 'DELETE' })
          )
        )
      }

      // 5. Publish
      const pubRes = await fetch(`/api/forms/${formId}/publish`, { method: 'POST' })
      const pubData = await pubRes.json()
      if (!pubRes.ok) {
        setPublishError(pubData.error || 'Erro ao publicar')
        setPublishing(false)
        return
      }

      // 6. Refresh from server (canonical state)
      const refreshRes = await fetch(`/api/forms/${formId}?t=${Date.now()}`, { cache: 'no-store' })
      if (refreshRes.ok) {
        const refreshed = await refreshRes.json()
        updateForm(refreshed)
        updateFields(refreshed.fields || [])
        updateOriginalFieldIds(new Set((refreshed.fields || []).map((f: any) => f.id)))
      }

      setHasChanges(false)
      setPublishError('')
    } catch (error) {
      console.error('Error publishing:', error)
      setPublishError('Erro de conexão')
    }
    setPublishing(false)
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
      <FormTopBar
        formId={formId}
        formName={form.name}
        onNameChange={(name) => {
          updateForm((prev: any) => ({ ...prev, name }))
          markChanged()
        }}
        formSlug={form.slug}
        formStatus={form.status}
        onPublish={publishForm}
        publishing={publishing}
        hasChanges={hasChanges}
        saveError={publishError}
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
            className="flex-1 flex items-center justify-center overflow-y-auto relative"
            style={{ backgroundColor: form.settings?.appearance?.backgroundColor || '#ffffff' }}
          >
            {form.settings?.appearance?.logoUrl && (
              <div className="absolute top-4 left-4">
                <img src={form.settings.appearance.logoUrl} alt="" className="h-8 max-w-[140px] object-contain" />
              </div>
            )}
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
                onUpdate={(partialSettings) => {
                  updateForm((prev: any) => {
                    const prevSettings = prev.settings || {}
                    const merged = { ...prevSettings }
                    for (const key of Object.keys(partialSettings)) {
                      if (typeof partialSettings[key] === 'object' && partialSettings[key] !== null && !Array.isArray(partialSettings[key])) {
                        merged[key] = { ...prevSettings[key], ...partialSettings[key] }
                      } else {
                        merged[key] = partialSettings[key]
                      }
                    }
                    return { ...prev, settings: merged }
                  })
                  markChanged()
                }}
              />
            )}
          </div>
        </div>
      </div>

      {showFieldSelector && (
        <FieldTypeSelector
          onSelect={addField}
          onClose={() => setShowFieldSelector(false)}
        />
      )}
    </div>
  )
}
