'use client'

import { cn } from '@/lib/utils'
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  ListChecks,
  Star,
  MessageSquare,
  Hand,
  Heart,
} from 'lucide-react'

const MVP_FIELD_TYPES = [
  { type: 'welcome', label: 'Boas-vindas', icon: Hand, color: 'text-purple-600 bg-purple-50' },
  { type: 'short_text', label: 'Resposta Curta', icon: Type, color: 'text-blue-600 bg-blue-50' },
  { type: 'long_text', label: 'Resposta Longa', icon: AlignLeft, color: 'text-cyan-600 bg-cyan-50' },
  { type: 'number', label: 'Número', icon: Hash, color: 'text-teal-600 bg-teal-50' },
  { type: 'email', label: 'Email', icon: Mail, color: 'text-green-600 bg-green-50' },
  { type: 'phone', label: 'Telefone', icon: Phone, color: 'text-orange-600 bg-orange-50' },
  { type: 'multiple_choice', label: 'Múltipla Escolha', icon: ListChecks, color: 'text-indigo-600 bg-indigo-50' },
  { type: 'satisfaction_scale', label: 'Escala (NPS)', icon: Star, color: 'text-yellow-600 bg-yellow-50' },
  { type: 'message', label: 'Mensagem', icon: MessageSquare, color: 'text-gray-600 bg-gray-50' },
  { type: 'thanks', label: 'Agradecimento', icon: Heart, color: 'text-red-600 bg-red-50' },
]

interface FieldTypeSelectorProps {
  onSelect: (type: string) => void
  onClose: () => void
}

export function FieldTypeSelector({ onSelect, onClose }: FieldTypeSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Campo</h3>
        <div className="grid grid-cols-2 gap-3">
          {MVP_FIELD_TYPES.map((field) => {
            const Icon = field.icon
            return (
              <button
                key={field.type}
                onClick={() => {
                  onSelect(field.type)
                  onClose()
                }}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
              >
                <div className={cn('p-2 rounded-lg', field.color)}>
                  <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
