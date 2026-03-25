'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface FormFieldInputProps {
  field: any
  value: any
  onChange: (value: any) => void
  onSubmit: () => void
  primaryColor: string
  error?: string
  appearance?: {
    textColor?: string
    descriptionColor?: string
    optionColor?: string
    answerFontSize?: string
    answerFontWeight?: string
    [key: string]: any
  }
}

export function FormFieldInput({
  field,
  value,
  onChange,
  onSubmit,
  primaryColor,
  error,
  appearance = {},
}: FormFieldInputProps) {
  const settings = field.settings || {}
  const textColor = appearance.textColor || '#111827'
  const optionColor = appearance.optionColor || '#d1d5db'
  const placeholderColor = appearance.placeholderColor || '#9ca3af'
  const [otherValue, setOtherValue] = useState('')

  // Inject dynamic placeholder color via CSS custom property
  const inputStyle: React.CSSProperties = {
    color: textColor,
    '--placeholder-color': placeholderColor,
  } as React.CSSProperties

  function formatPhone(digits: string): string {
    const d = digits.replace(/\D/g, '')
    if (d.length > 6) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
    if (d.length > 2) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return d
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className={cn('w-full', error && 'animate-shake')}>
      {/* Short Text */}
      {field.type === 'short_text' && (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || 'Digite sua resposta...'}
          maxLength={settings.maxLength || undefined}
          autoFocus
          className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-lg transition-colors custom-placeholder"
          style={{ ...inputStyle, borderColor: value ? primaryColor : undefined }}
        />
      )}

      {/* Email */}
      {field.type === 'email' && (
        <input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || 'nome@email.com'}
          autoFocus
          className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-lg transition-colors custom-placeholder"
          style={{ ...inputStyle, borderColor: value ? primaryColor : undefined }}
        />
      )}

      {/* Phone */}
      {field.type === 'phone' && (
        <input
          type="tel"
          value={formatPhone(value || '')}
          onChange={(e) => {
            // Store only digits, format on display
            const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
            onChange(digits)
          }}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || '(11) 99999-9999'}
          autoFocus
          className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-lg transition-colors custom-placeholder"
          style={{ ...inputStyle, borderColor: value ? primaryColor : undefined }}
        />
      )}

      {/* Number */}
      {field.type === 'number' && (
        <input
          type="number"
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || 'Digite um número...'}
          autoFocus
          className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-lg transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none custom-placeholder"
          style={{ ...inputStyle, borderColor: value !== undefined && value !== '' ? primaryColor : undefined }}
        />
      )}

      {/* Multiple Choice */}
      {field.type === 'multiple_choice' && (
        <div className="space-y-2">
          {(settings.options || []).map((option: any, i: number) => {
            const isSelected = value === (option.value || option.label)
            return (
              <button
                key={option.id || i}
                onClick={() => {
                  onChange(option.value || option.label)
                  setTimeout(onSubmit, 300)
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all"
                style={{
                  border: `2px solid ${isSelected ? primaryColor : optionColor}`,
                  backgroundColor: isSelected ? `${primaryColor}10` : 'transparent',
                }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    border: `2px solid ${isSelected ? primaryColor : optionColor}`,
                    color: isSelected ? primaryColor : textColor,
                  }}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="font-medium" style={{ color: textColor }}>{option.label}</span>
              </button>
            )
          })}
          {settings.allowOther && (
            <div
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ border: `2px dashed ${optionColor}` }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ border: `2px solid ${optionColor}`, color: textColor }}
              >
                ?
              </span>
              <input
                type="text"
                value={otherValue}
                onChange={(e) => {
                  setOtherValue(e.target.value)
                  onChange(`other:${e.target.value}`)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Outro..."
                className="flex-1 bg-transparent outline-none"
                style={{ color: textColor }}
              />
            </div>
          )}
        </div>
      )}

      {/* Satisfaction Scale */}
      {field.type === 'satisfaction_scale' && (
        <div>
          <div className="flex gap-2 justify-center flex-wrap my-4">
            {Array.from(
              { length: (settings.scaleMax ?? 10) - (settings.scaleMin ?? 0) + 1 },
              (_, i) => (settings.scaleMin ?? 0) + i
            ).map((num) => (
              <button
                key={num}
                onClick={() => {
                  onChange(num)
                  setTimeout(onSubmit, 300)
                }}
                className={cn(
                  'w-12 h-12 rounded-lg border-2 text-sm font-bold transition-all',
                  value === num
                    ? 'text-white'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                )}
                style={
                  value === num
                    ? { backgroundColor: primaryColor, borderColor: primaryColor }
                    : undefined
                }
              >
                {num}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-400 px-1">
            <span>{settings.scaleMinLabel || ''}</span>
            <span>{settings.scaleMaxLabel || ''}</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}
    </div>
  )
}
