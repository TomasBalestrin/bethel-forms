'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Hand,
  Heart,
  MessageSquare,
} from 'lucide-react'

interface FieldPreviewProps {
  field: any
  primaryColor?: string
}

export function FieldPreview({ field, primaryColor = '#2563eb' }: FieldPreviewProps) {
  if (!field) return null

  const settings = field.settings || {}

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="w-full max-w-lg">
        {/* Welcome */}
        {field.type === 'welcome' && (
          <div className="text-center">
            <Hand className="mx-auto mb-4 text-purple-500" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{field.title || 'Bem-vindo!'}</h2>
            <p className="text-gray-500 mb-6">{field.description || 'Preencha o formulário'}</p>
            <button
              className="px-8 py-3 rounded-lg text-white font-medium"
              style={{ backgroundColor: primaryColor }}
            >
              Começar
            </button>
          </div>
        )}

        {/* Short Text */}
        {field.type === 'short_text' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {field.title || 'Pergunta'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-gray-500 text-sm mb-4">{field.description}</p>}
            <Input placeholder={field.placeholder || 'Digite sua resposta...'} disabled />
          </div>
        )}

        {/* Email */}
        {field.type === 'email' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {field.title || 'Seu email'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-gray-500 text-sm mb-4">{field.description}</p>}
            <Input type="email" placeholder={field.placeholder || 'nome@email.com'} disabled />
          </div>
        )}

        {/* Phone */}
        {field.type === 'phone' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {field.title || 'Seu telefone'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-gray-500 text-sm mb-4">{field.description}</p>}
            <Input type="tel" placeholder={field.placeholder || '(11) 99999-9999'} disabled />
          </div>
        )}

        {/* Multiple Choice */}
        {field.type === 'multiple_choice' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {field.title || 'Escolha uma opção'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-gray-500 text-sm mb-4">{field.description}</p>}
            <div className="space-y-2">
              {(settings.options || [{ id: '1', label: 'Opção 1' }, { id: '2', label: 'Opção 2' }]).map(
                (option: any, i: number) => (
                  <div
                    key={option.id || i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer"
                  >
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                    <span className="text-gray-700">{option.label}</span>
                  </div>
                )
              )}
              {settings.allowOther && (
                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 border-dashed">
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
                  <span className="text-gray-400">Outro...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Satisfaction Scale */}
        {field.type === 'satisfaction_scale' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {field.title || 'Como você avalia?'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-gray-500 text-sm mb-4">{field.description}</p>}
            <div className="flex gap-2 justify-center my-4">
              {Array.from(
                { length: (settings.scaleMax ?? 10) - (settings.scaleMin ?? 0) + 1 },
                (_, i) => (settings.scaleMin ?? 0) + i
              ).map((num) => (
                <button
                  key={num}
                  className="w-10 h-10 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:border-blue-400 hover:bg-blue-50"
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{settings.scaleMinLabel || ''}</span>
              <span>{settings.scaleMaxLabel || ''}</span>
            </div>
          </div>
        )}

        {/* Message */}
        {field.type === 'message' && (
          <div className="text-center">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={36} />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{field.title || 'Mensagem'}</h2>
            {field.description && <p className="text-gray-500">{field.description}</p>}
          </div>
        )}

        {/* Thanks */}
        {field.type === 'thanks' && (
          <div className="text-center">
            <Heart className="mx-auto mb-4 text-red-400" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{field.title || 'Obrigado!'}</h2>
            {field.description && <p className="text-gray-500 mb-4">{field.description}</p>}
            {settings.thanksType === 'redirect' && settings.buttonText && (
              <button
                className="px-6 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                {settings.buttonText}
              </button>
            )}
          </div>
        )}

        {/* Next button for input fields */}
        {!['welcome', 'thanks', 'message'].includes(field.type) && (
          <div className="mt-6">
            <button
              className="px-6 py-2.5 rounded-lg text-white font-medium text-sm"
              style={{ backgroundColor: primaryColor }}
            >
              Próximo →
            </button>
            <span className="text-xs text-gray-400 ml-3">ou pressione Enter ↵</span>
          </div>
        )}
      </div>
    </div>
  )
}
