'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { FormFieldInput } from '@/components/form-renderer/form-field-input'
import { TrackingScripts, fireTrackingEvent } from '@/components/form-renderer/tracking-scripts'
import { cn } from '@/lib/utils'

export default function PublicFormPage() {
  return (
    <Suspense>
      <PublicFormContent />
    </Suspense>
  )
}

function PublicFormContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = params.slug as string

  const [formData, setFormData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [responseId, setResponseId] = useState<string | null>(null)
  const responseIdRef = useRef<string | null>(null)
  const [fieldError, setFieldError] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const transitionLock = useRef(false)

  useEffect(() => {
    loadForm()
  }, [slug])

  // Force background color on html/body to eliminate white borders on mobile
  useEffect(() => {
    const bg = formData?.appearance?.backgroundColor || '#ffffff'
    document.documentElement.style.backgroundColor = bg
    document.body.style.backgroundColor = bg
    // Set theme-color meta for mobile browser chrome
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = bg
    return () => {
      document.documentElement.style.backgroundColor = ''
      document.body.style.backgroundColor = ''
      if (meta) meta.content = '#ffffff'
    }
  }, [formData?.appearance?.backgroundColor])

  async function loadForm() {
    try {
      const res = await fetch(`/api/public/forms/${slug}?t=${Date.now()}`, { cache: 'no-store' })
      if (!res.ok) {
        setError('Formulário não encontrado')
        setLoading(false)
        return
      }
      const data = await res.json()
      setFormData(data)
      setLoading(false)

      fireTrackingEvent('PageView', { form_id: data.id }, data.tracking)
    } catch {
      setError('Erro ao carregar formulário')
      setLoading(false)
    }
  }

  async function startForm() {
    if (responseIdRef.current) return

    const utms: Record<string, string> = {}
    ;['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach((key) => {
      const val = searchParams.get(key)
      if (val) utms[key] = val
    })

    try {
      const res = await fetch(`/api/public/forms/${slug}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utms }),
      })
      if (res.ok) {
        const data = await res.json()
        responseIdRef.current = data.responseId
        setResponseId(data.responseId)
        fireTrackingEvent('StartForm', { form_id: formData.id }, formData.tracking)
      }
    } catch (err) {
      console.error('Error starting form:', err)
    }
  }

  const fields = formData?.fields || []
  const currentField = fields[currentIndex]
  const appearance = formData?.appearance || {}
  const primaryColor = appearance.primaryColor || '#2563eb'
  const textColor = appearance.textColor || '#111827'

  const titleStyle: React.CSSProperties = {
    color: textColor,
  }
  const descriptionColor = appearance.descriptionColor || '#6b7280'
  const descStyle: React.CSSProperties = {
    color: descriptionColor,
  }
  const answerStyle: React.CSSProperties = {}
  const totalInputFields = fields.filter(
    (f: any) => !['welcome', 'thanks', 'message'].includes(f.type)
  ).length
  const answeredInputFields = fields
    .filter((f: any) => !['welcome', 'thanks', 'message'].includes(f.type))
    .filter((f: any) => answers[f.id] !== undefined).length
  const progress = totalInputFields > 0 ? (answeredInputFields / totalInputFields) * 100 : 0

  function validateField(field: any, value: any): string | null {
    if (field.required && (value === undefined || value === null || value === '')) {
      return 'Este campo é obrigatório'
    }
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) return 'Informe um email válido'
    }
    if (field.type === 'phone' && value) {
      const digits = value.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 11) return 'Informe um telefone válido'
    }
    if (field.type === 'number' && value !== undefined && value !== '' && isNaN(Number(value))) {
      return 'Informe um número válido'
    }
    if (field.type === 'satisfaction_scale' && field.required && (value === undefined || value === null)) {
      return 'Selecione uma opção'
    }
    if (field.type === 'multiple_choice' && field.required && !value) {
      return 'Selecione uma opção'
    }
    if (field.type === 'multiple_choice' && value && typeof value === 'object' && value.option) {
      const selectedOpt = (field.settings?.options || []).find(
        (o: any) => (o.value || o.label) === value.option
      )
      if (selectedOpt?.hasTextInput && !value.text?.trim()) {
        return 'Preencha o campo de texto'
      }
    }
    if (field.type === 'cpf' && value) {
      const digits = value.replace(/\D/g, '')
      if (digits.length !== 11) return 'Informe um CPF válido'
    }
    return null
  }

  async function goNext() {
    if (!currentField || transitionLock.current) return
    transitionLock.current = true

    if (currentField.type === 'welcome') {
      startForm()
      transition(currentIndex + 1)
      return
    }

    const value = answers[currentField.id]
    const validationError = validateField(currentField, value)
    if (validationError) {
      setFieldError(validationError)
      transitionLock.current = false
      return
    }
    setFieldError('')

    const rid = responseIdRef.current
    if (rid && !['welcome', 'thanks', 'message'].includes(currentField.type)) {
      const fieldToSave = currentField
      fetch(`/api/public/forms/${slug}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responseId: rid,
          fieldId: fieldToSave.id,
          value: value ?? null,
        }),
      }).then(() => {
        fireTrackingEvent('SubmitAnswer', {
          form_id: formData.id,
          field_id: fieldToSave.id,
          field_title: fieldToSave.title,
        }, formData.tracking)

        if (fieldToSave.conversionEvent) {
          fireTrackingEvent('FormFlowConversion', {
            form_id: formData.id,
            form_name: formData.name,
            field_id: fieldToSave.id,
            field_title: fieldToSave.title,
          }, formData.tracking)
        }
      }).catch((err) => {
        console.error('Error saving answer:', err)
      })
    }

    const nextField = fields[currentIndex + 1]
    if (nextField?.type === 'thanks') {
      completeForm()
      transition(currentIndex + 1)
      return
    }

    if (currentIndex + 1 >= fields.length) {
      completeForm()
      setCompleted(true)
      transitionLock.current = false
      return
    }

    transition(currentIndex + 1)
  }

  async function completeForm() {
    const rid = responseIdRef.current
    if (!rid) return
    try {
      await fetch(`/api/public/forms/${slug}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId: rid }),
      })
      setCompleted(true)
      fireTrackingEvent('EndForm', { form_id: formData.id }, formData.tracking)
    } catch (err) {
      console.error('Error completing form:', err)
    }
  }

  function goPrev() {
    if (currentIndex > 0 && !transitionLock.current) {
      transitionLock.current = true
      transition(currentIndex - 1)
    }
  }

  function transition(nextIndex: number) {
    setTransitioning(true)
    setTimeout(() => {
      setCurrentIndex(nextIndex)
      setFieldError('')
      setTransitioning(false)
      transitionLock.current = false
    }, 120)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: appearance.backgroundColor || '#fff' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: primaryColor }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: appearance.backgroundColor || '#ffffff',
        color: appearance.textColor || '#111827',
      }}
    >
      <TrackingScripts
        pixelId={formData.tracking?.pixelId}
        gaId={formData.tracking?.gaId}
        gtmId={formData.tracking?.gtmId}
      />

      {/* Progress Bar */}
      {appearance.progressBar !== 'hidden' && currentField?.type !== 'welcome' && currentField?.type !== 'thanks' && (
        <div className="fixed top-0 left-0 right-0 z-50">
          {appearance.progressBar === 'steps' ? (
            <div className="text-center py-2 text-sm text-gray-500">
              {answeredInputFields} de {totalInputFields}
            </div>
          ) : (
            <div className="h-1 bg-gray-200">
              <div
                className="h-full progress-bar-fill"
                style={{ width: `${progress}%`, backgroundColor: primaryColor }}
              />
            </div>
          )}
        </div>
      )}

      {/* Logo */}
      {appearance.logoUrl && (
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
          <img src={appearance.logoUrl} alt="Logo" className="h-6 sm:h-8 max-w-[100px] sm:max-w-[140px] object-contain" />
        </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          'flex-1 flex items-center justify-center px-5 sm:px-8 py-12 sm:py-16 transition-opacity duration-[120ms]',
          transitioning ? 'opacity-0' : 'opacity-100'
        )}
      >
        <div className="w-full max-w-xl">
          {/* Fallback thanks screen */}
          {completed && !currentField && (
            <div className="text-center">
              <h1 className="form-title mb-3">Obrigado!</h1>
              <p className="form-desc text-gray-500">Suas respostas foram enviadas com sucesso.</p>
            </div>
          )}

          {currentField && (
            <>
              {/* Welcome */}
              {currentField.type === 'welcome' && (
                <div className="text-center">
                  <h1 className="form-title mb-3" style={titleStyle}>{currentField.title}</h1>
                  {currentField.description && (
                    <p className="form-desc mb-6 sm:mb-8 whitespace-pre-line text-left" style={descStyle}>{currentField.description}</p>
                  )}
                  <button
                    onClick={goNext}
                    className="w-full sm:w-auto px-8 py-3.5 sm:py-3 rounded-lg text-white font-medium form-answer min-h-[48px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Começar
                  </button>
                </div>
              )}

              {/* Thanks */}
              {currentField.type === 'thanks' && (
                <div className="text-center">
                  <h1 className="form-title mb-3" style={titleStyle}>{currentField.title}</h1>
                  {currentField.description && (
                    <p className="form-desc mb-6 whitespace-pre-line text-center" style={descStyle}>{currentField.description}</p>
                  )}
                  {currentField.settings?.thanksType === 'redirect' && currentField.settings?.redirectUrl && /^https?:\/\//.test(currentField.settings.redirectUrl) && (
                    <a
                      href={currentField.settings.redirectUrl}
                      rel="noopener noreferrer"
                      className="inline-block px-6 py-3 rounded-lg text-white font-medium min-h-[48px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {currentField.settings.buttonText || 'Continuar'}
                    </a>
                  )}
                </div>
              )}

              {/* Message */}
              {currentField.type === 'message' && (
                <div className="text-center">
                  <h2 className="form-title mb-3" style={titleStyle}>{currentField.title}</h2>
                  {currentField.description && (
                    <p className="form-desc mb-6 whitespace-pre-line" style={descStyle}>{currentField.description}</p>
                  )}
                  <button
                    onClick={goNext}
                    className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-medium min-h-[48px]"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Continuar
                  </button>
                </div>
              )}

              {/* Input fields */}
              {!['welcome', 'thanks', 'message'].includes(currentField.type) && (
                <div>
                  {(currentField.title || currentField.required) && (
                    <h2 className="form-title mb-1" style={titleStyle}>
                      {currentField.title || ''}
                      {currentField.required && <span className="text-red-500 ml-1">*</span>}
                    </h2>
                  )}
                  {currentField.description && (
                    <p className="form-desc mb-4 sm:mb-6 whitespace-pre-line" style={descStyle}>{currentField.description}</p>
                  )}

                  <FormFieldInput
                    field={currentField}
                    value={answers[currentField.id]}
                    onChange={(val) => {
                      setAnswers({ ...answers, [currentField.id]: val })
                      setFieldError('')
                    }}
                    onSubmit={goNext}
                    primaryColor={primaryColor}
                    error={fieldError}
                    appearance={appearance}
                  />

                  <div className="mt-6 sm:mt-8">
                    <button
                      onClick={goNext}
                      className="w-full sm:w-auto px-6 py-3 rounded-lg text-white font-medium text-sm min-h-[48px]"
                      style={{ backgroundColor: primaryColor }}
                    >
                      OK ✓
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Navigation — mobile: bottom bar, desktop: bottom-right */}
      {currentField?.type !== 'welcome' && currentField?.type !== 'thanks' && (
        <div className="fixed bottom-4 right-4 flex gap-2 z-40">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            aria-label="Pergunta anterior"
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg bg-white shadow border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={goNext}
            aria-label="Próxima pergunta"
            className="w-11 h-11 sm:w-10 sm:h-10 rounded-lg bg-white shadow border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50"
          >
            ↓
          </button>
        </div>
      )}
    </div>
  )
}
