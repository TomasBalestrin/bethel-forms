'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FormTopBar } from '@/components/dashboard/form-top-bar'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUp,
  Phone,
  Mail,
} from 'lucide-react'
import { ColorTagPicker } from '@/components/dashboard/color-tag-picker'

export default function ResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const { status: authStatus } = useSession()
  const formId = params.formId as string

  const [form, setForm] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'table' | 'individual'>('table')
  const [selectedResponse, setSelectedResponse] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') router.push('/login')
  }, [authStatus, router])

  useEffect(() => {
    fetchForm()
    fetchMetrics()
  }, [formId])

  useEffect(() => {
    fetchResponses()
  }, [formId, pagination.page, statusFilter])

  async function fetchForm() {
    const res = await fetch(`/api/forms/${formId}`)
    if (res.ok) setForm(await res.json())
  }

  async function fetchResponses() {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: '50',
    })
    if (statusFilter) params.set('status', statusFilter)

    const res = await fetch(`/api/forms/${formId}/responses?${params}`)
    if (res.ok) {
      const data = await res.json()
      setResponses(data.responses)
      setPagination(data.pagination)
    }
    setLoading(false)
  }

  async function fetchMetrics() {
    const res = await fetch(`/api/forms/${formId}/metrics`)
    if (res.ok) setMetrics(await res.json())
  }

  async function exportCSV() {
    const res = await fetch(`/api/forms/${formId}/exports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'csv' }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${form?.name || 'respostas'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  async function deleteResponse(responseId: string) {
    if (!confirm('Excluir esta resposta?')) return
    const res = await fetch(`/api/forms/${formId}/responses/${responseId}`, { method: 'DELETE' })
    if (res.ok) {
      setResponses(responses.filter((r) => r.id !== responseId))
      if (selectedResponse?.id === responseId) setSelectedResponse(null)
    }
  }

  // Build table columns from current form fields + any extra fields found in responses
  const currentFields = (form?.fields || []).filter(
    (f: any) => !['welcome', 'thanks', 'message'].includes(f.type)
  )
  const currentFieldIds = new Set(currentFields.map((f: any) => f.id))

  const extraFieldsMap = new Map<string, any>()
  responses.forEach((r: any) => {
    r.answers?.forEach((a: any) => {
      if (a.field && !currentFieldIds.has(a.field.id) && !['welcome', 'thanks', 'message'].includes(a.field.type)) {
        extraFieldsMap.set(a.field.id, a.field)
      }
    })
  })
  const extraFields = Array.from(extraFieldsMap.values()).sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
  const fields = [...currentFields, ...extraFields]

  function getAnswerValue(response: any, fieldId: string): string {
    const answer = response.answers?.find(
      (a: any) => a.fieldId === fieldId || a.field_id === fieldId
    )
    if (!answer) return ''
    const val = answer.value
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') {
      if (val.option && val.text) return `${val.option}: ${val.text}`
      if (val.option) return String(val.option)
      return JSON.stringify(val)
    }
    return String(val)
  }

  function getFirstAnswer(response: any): string {
    const sorted = (response.answers || [])
      .filter((a: any) => a.field && !['welcome', 'thanks', 'message'].includes(a.field.type))
      .sort((a: any, b: any) => (a.field?.order || 0) - (b.field?.order || 0))
    if (sorted.length === 0) return 'Sem respostas'
    const val = sorted[0].value
    if (val === null || val === undefined) return 'Sem respostas'
    return typeof val === 'object' ? JSON.stringify(val) : String(val)
  }

  function formatPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '')
    if (digits.length === 11) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    }
    if (digits.length === 10) {
      return `+55 (${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
    }
    return phone
  }

  const selectedIdx = selectedResponse ? responses.indexOf(selectedResponse) : -1

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <FormTopBar
        formId={formId}
        formName={form?.name || 'Respostas'}
        formSlug={form?.slug}
        formStatus={form?.status}
        rightActions={
          <div className="flex items-center gap-2">
            {/* Table toggle */}
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-xs text-gray-500">Tabela</span>
              <button
                onClick={() => {
                  setView(view === 'table' ? 'individual' : 'table')
                  if (view === 'table' && responses.length > 0 && !selectedResponse) {
                    setSelectedResponse(responses[0])
                  }
                }}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  view === 'table' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${
                  view === 'table' ? 'translate-x-4' : ''
                }`} />
              </button>
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs text-gray-600"
            >
              <option value="">Filtros</option>
              <option value="complete">Completas</option>
              <option value="partial">Parciais</option>
            </select>

            {/* Export */}
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 rounded-md border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <Download size={12} />
              Exportar
            </button>
          </div>
        }
      />

      {/* Table View */}
      {view === 'table' && (
        <div className="flex-1 overflow-auto">
          <table className="w-full bg-white">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-gray-200 bg-white">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 w-12">#</th>
                <th className="w-10 px-1"></th>
                {fields.map((f: any, i: number) => (
                  <th key={f.id} className="text-left px-4 py-3 text-xs font-medium text-gray-500 whitespace-nowrap">
                    {i + 1}.{f.title || f.type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={fields.length + 2} className="text-center py-16 text-gray-400 text-sm">
                    Carregando...
                  </td>
                </tr>
              ) : responses.length === 0 ? (
                <tr>
                  <td colSpan={fields.length + 2} className="text-center py-16 text-gray-400 text-sm">
                    Nenhuma resposta ainda
                  </td>
                </tr>
              ) : (
                responses.map((response, idx) => (
                  <tr
                    key={response.id}
                    onClick={() => { setSelectedResponse(response); setView('individual') }}
                    className="border-b border-gray-100 hover:bg-blue-50/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 font-medium">
                      {pagination.total - ((pagination.page - 1) * 50 + idx)}
                    </td>
                    <td className="px-1 py-3">
                      <ColorTagPicker
                        color={response.tags?.[0] || null}
                        onChange={async (color) => {
                          const prev = [...responses]
                          setResponses(responses.map((r: any) =>
                            r.id === response.id ? { ...r, tags: color ? [color] : [] } : r
                          ))
                          try {
                            const res = await fetch(`/api/forms/${formId}/responses/${response.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ color }),
                            })
                            if (!res.ok) setResponses(prev)
                          } catch {
                            setResponses(prev)
                          }
                        }}
                      />
                    </td>
                    {fields.map((f: any) => {
                      const val = getAnswerValue(response, f.id)
                      const isPhone = f.type === 'phone' && val
                      return (
                        <td key={f.id} className="px-4 py-3 text-sm max-w-[220px]">
                          {val ? (
                            <span className={cn('truncate block', isPhone && 'text-blue-600')}>
                              {isPhone ? formatPhone(val) : val}
                              {isPhone && (
                                <Phone size={12} className="inline-block ml-1.5 text-green-500" />
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-300 italic text-xs">Não respondeu...</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Load more / pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center py-6 border-t border-gray-100 bg-white">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page <= 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-500">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Individual View */}
      {view === 'individual' && (
        <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
          {/* Left list */}
          <div className="w-full sm:w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">
                {pagination.total} {pagination.total === 1 ? 'resposta' : 'respostas'}.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {responses.map((response, idx) => {
                const num = pagination.total - ((pagination.page - 1) * 50 + idx)
                const name = getFirstAnswer(response)
                const isSelected = selectedResponse?.id === response.id
                return (
                  <button
                    key={response.id}
                    onClick={() => setSelectedResponse(response)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-gray-50 transition-colors',
                      isSelected
                        ? 'bg-blue-50 border-l-2 border-l-blue-500'
                        : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                    )}
                  >
                    <p className={cn(
                      'text-sm truncate',
                      isSelected ? 'font-semibold text-blue-600' : 'text-gray-700'
                    )}>
                      {num}. {name}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right detail */}
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            {selectedResponse ? (
              <div className="max-w-3xl mx-auto py-6 px-6">
                {/* Header */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Top gradient bar */}
                  <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500" />

                  {/* Meta info */}
                  <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="text-xs text-gray-500">
                      <span>Data de início: {formatDate(selectedResponse.createdAt)}</span>
                      <br />
                      <span className="text-gray-400">Identificador: {selectedResponse.id}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedResponse.status === 'complete' ? 'success' : 'warning'}>
                        {selectedResponse.status === 'complete' ? 'Completa' : 'Parcial'}
                      </Badge>
                      {/* Navigation arrows */}
                      <button
                        onClick={() => {
                          if (selectedIdx > 0) setSelectedResponse(responses[selectedIdx - 1])
                        }}
                        disabled={selectedIdx <= 0}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={() => {
                          if (selectedIdx < responses.length - 1) setSelectedResponse(responses[selectedIdx + 1])
                        }}
                        disabled={selectedIdx >= responses.length - 1}
                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 text-gray-500"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Answers */}
                  <div className="px-6 py-5 space-y-6">
                    {selectedResponse.answers
                      ?.sort((a: any, b: any) => (a.field?.order || 0) - (b.field?.order || 0))
                      .filter((a: any) => a.field && !['welcome', 'thanks', 'message'].includes(a.field?.type))
                      .map((answer: any) => {
                        const isPhone = answer.field?.type === 'phone'
                        const isEmail = answer.field?.type === 'email'
                        const val = answer.value
                        const displayVal = val === null || val === undefined
                          ? null
                          : typeof val === 'object'
                            ? JSON.stringify(val)
                            : String(val)

                        return (
                          <div key={answer.id} className="border-b border-gray-100 pb-5 last:border-b-0 last:pb-0">
                            <p className="text-sm font-medium text-blue-600 mb-1.5">
                              {answer.field?.title || 'Campo removido'}
                            </p>
                            <div className="flex items-center gap-2">
                              <p className="text-base text-gray-900 font-medium">
                                {displayVal || <span className="text-gray-300 italic text-sm font-normal">Não respondeu</span>}
                              </p>
                              {isPhone && displayVal && (
                                <a
                                  href={`https://wa.me/55${String(val).replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded hover:bg-green-50 text-green-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Phone size={14} />
                                </a>
                              )}
                              {isEmail && displayVal && (
                                <a
                                  href={`mailto:${val}`}
                                  className="p-1 rounded hover:bg-blue-50 text-blue-500"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Mail size={14} />
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>

                  {/* UTM Data */}
                  {selectedResponse.metadata && (
                    Object.entries(selectedResponse.metadata)
                      .filter(([key]) => key.startsWith('utm_') || key === 'fbclid' || key === 'gclid')
                      .length > 0
                  ) && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                      <table className="w-full text-xs">
                        <tbody>
                          {['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].map((key) => {
                            const val = selectedResponse.metadata?.[key]
                            if (!val) return null
                            const label = key.replace('utm_', '').charAt(0).toUpperCase() + key.replace('utm_', '').slice(1)
                            return (
                              <tr key={key}>
                                <td className="py-1 pr-4 text-gray-400 font-medium w-24">{key.startsWith('utm_') ? label + ':' : key.charAt(0).toUpperCase() + key.slice(1) + ':'}</td>
                                <td className="py-1 text-gray-600 break-all">{val}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600"
                    >
                      <ArrowUp size={12} />
                      Voltar ao topo
                    </button>
                    <button
                      onClick={() => deleteResponse(selectedResponse.id)}
                      className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Selecione uma resposta na lista
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
