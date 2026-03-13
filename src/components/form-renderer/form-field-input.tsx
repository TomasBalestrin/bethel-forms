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
}

export function FormFieldInput({
  field,
  value,
  onChange,
  onSubmit,
  primaryColor,
  error,
}: FormFieldInputProps) {
  const settings = field.settings || {}
  const [otherValue, setOtherValue] = useState('')

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
          className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-lg transition-colors"
          style={{ borderColor: value ? primaryColor : undefined }}
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
          className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-lg transition-colors"
          style={{ borderColor: value ? primaryColor : undefined }}
        />
      )}

      {/* Phone */}
      {field.type === 'phone' && (
        <input
          type="tel"
          value={value || ''}
          onChange={(e) => {
            let v = e.target.value.replace(/\D/g, '')
            if (v.length > 11) v = v.slice(0, 11)
            if (v.length > 6) {
              v = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`
            } else if (v.length > 2) {
              v = `(${v.slice(0, 2)}) ${v.slice(2)}`
            }
            onChange(v)
          }}
          onKeyDown={handleKeyDown}
          placeholder={field.placeholder || '(11) 99999-9999'}
          autoFocus
          className="w-full bg-transparent border-b-2 border-gray-300 focus:border-blue-500 outline-none py-2 text-lg transition-colors"
          style={{ borderColor: value ? primaryColor : undefined }}
        />
      )}

      {/* Multiple Choice */}
      {field.type === 'multiple_choice' && (
        <div className="space-y-2">
          {(settings.options || []).map((option: any, i: number) => (
            <button
              key={option.id || i}
              onClick={() => {
                onChange(option.value || option.label)
                setTimeout(onSubmit, 300)
              }}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
                value === (option.value || option.label)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-400'
              )}
              style={
                value === (option.value || option.label)
                  ? { borderColor: primaryColor, backgroundColor: `${primaryColor}10` }
                  : undefined
              }
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-xs font-bold',
                  value === (option.value || option.label) ? 'border-blue-500 text-blue-600' : 'border-gray-300'
                )}
                style={
                  value === (option.value || option.label)
                    ? { borderColor: primaryColor, color: primaryColor }
                    : undefined
                }
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-gray-800 font-medium">{option.label}</span>
            </button>
          ))}
          {settings.allowOther && (
            <div className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200">
              <span className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-400">
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
                className="flex-1 bg-transparent outline-none text-gray-800"
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
