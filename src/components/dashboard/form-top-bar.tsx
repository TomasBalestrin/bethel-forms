'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ArrowLeft, Eye, Share2, Check, Pencil } from 'lucide-react'

interface FormTopBarProps {
  formId: string
  formName: string
  onNameChange?: (name: string) => void
  formSlug?: string
  formStatus?: string
  onPublish?: () => void
  publishing?: boolean
  saving?: boolean
  hasChanges?: boolean
  saveError?: string
  rightActions?: React.ReactNode
}

const tabs = [
  { label: 'Editor', path: 'edit' },
  { label: 'Respostas', path: 'responses' },
]

export function FormTopBar({
  formId,
  formName,
  onNameChange,
  formSlug,
  formStatus,
  onPublish,
  publishing,
  saving,
  hasChanges,
  saveError,
  rightActions,
}: FormTopBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [editingName, setEditingName] = useState(false)

  const activeTab = tabs.find((t) => pathname.includes(t.path))?.path || 'edit'

  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 flex-shrink-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={() => router.push('/dash')}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
        {editingName && onNameChange ? (
          <input
            autoFocus
            value={formName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false) }}
            className="text-sm font-semibold text-gray-900 bg-white border border-blue-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        ) : (
          <button
            onClick={() => onNameChange && setEditingName(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 truncate max-w-[240px] hover:text-blue-600 transition-colors group"
            title="Clique para editar o nome"
          >
            {formName || 'Sem título'}
            {onNameChange && <Pencil size={12} className="text-gray-300 group-hover:text-blue-400 flex-shrink-0" />}
          </button>
        )}
        {saving && (
          <span className="text-xs text-gray-400 flex-shrink-0">Salvando...</span>
        )}
        {hasChanges && !saving && (
          <span className="text-xs text-amber-500 flex-shrink-0">Alterações não salvas</span>
        )}
        {saveError && (
          <span className="text-xs text-red-500 flex-shrink-0">{saveError}</span>
        )}
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            href={`/form/${formId}/${tab.path}`}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-md transition-colors',
              activeTab === tab.path
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {rightActions}
        {formSlug && (
          <button
            onClick={() => window.open(`/${formSlug}`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            Ver
          </button>
        )}
        {formSlug && (
          <button
            onClick={() => {
              const url = `${window.location.origin}/${formSlug}`
              navigator.clipboard.writeText(url)
              setCopied(true)
              setTimeout(() => setCopied(false), 2000)
            }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md border transition-colors',
              copied
                ? 'text-green-600 border-green-200 bg-green-50'
                : 'text-gray-500 border-gray-200 hover:bg-gray-50'
            )}
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            {copied ? 'Copiado!' : ''}
          </button>
        )}
        {formStatus === 'published' && (
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-md">
            <Check size={12} />
            Publicado
          </span>
        )}
        {onPublish && (
          <button
            onClick={onPublish}
            disabled={publishing || saving}
            className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {publishing ? 'Publicando...' : saving ? 'Salvando...' : 'Publicar'}
          </button>
        )}
      </div>
    </div>
  )
}
