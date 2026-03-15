'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import {
  ArrowLeft,
  Download,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react'

export default function ResponsesPage() {
  const params = useParams()
  const router = useRouter()
  const { status: authStatus } = useSession()
  const formId = params.formId as string

  const [form, setForm] = useState<any>(null)
  const [responses, setResponses] = useState<any[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'table' | 'card'>('table')
  const [selectedResponse, setSelectedResponse] = useState<any>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')
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

  const fields = form?.fields?.filter(
    (f: any) => !['welcome', 'thanks', 'message'].includes(f.type)
  ) || []

  function getAnswerValue(response: any, fieldId: string): string {
    const answer = response.answers?.find((a: any) => a.fieldId === fieldId)
    if (!answer) return '-'
    const val = answer.value
    if (val === null || val === undefined) return '-'
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dash')} className="p-1.5 rounded hover:bg-gray-100">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{form?.name || 'Respostas'}</h1>
              <p className="text-sm text-gray-500">Respostas do formulário</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/form/${formId}/edit`)}>
              Editar formulário
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download size={14} className="mr-1" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BarChart3 className="text-blue-500" size={20} />
                <div>
                  <p className="text-lg font-bold">{metrics.totalResponses}</p>
                  <p className="text-xs text-gray-500">Total respostas</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="text-green-500" size={20} />
                <div>
                  <p className="text-lg font-bold">{metrics.completionRate}%</p>
                  <p className="text-xs text-gray-500">Taxa conclusão</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="text-yellow-500" size={20} />
                <div>
                  <p className="text-lg font-bold">{metrics.partialResponses}</p>
                  <p className="text-xs text-gray-500">Parciais</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="text-purple-500" size={20} />
                <div>
                  <p className="text-lg font-bold">
                    {metrics.avgDurationSeconds > 60
                      ? `${Math.round(metrics.avgDurationSeconds / 60)}min`
                      : `${metrics.avgDurationSeconds}s`}
                  </p>
                  <p className="text-xs text-gray-500">Tempo médio</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar respostas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">Todos os status</option>
            <option value="complete">Completas</option>
            <option value="partial">Parciais</option>
          </select>
          <div className="flex border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={() => { setView('table'); setSelectedResponse(null) }}
              className={`px-3 py-2 text-sm ${view === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              Tabela
            </button>
            <button
              onClick={() => setView('card')}
              className={`px-3 py-2 text-sm ${view === 'card' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}
            >
              Individual
            </button>
          </div>
        </div>

        {/* Table View */}
        {view === 'table' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  {fields.slice(0, 5).map((f: any) => (
                    <th key={f.id} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase truncate max-w-[150px]">
                      {f.title || f.type}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={fields.length + 3} className="text-center py-8 text-gray-400">
                      Carregando...
                    </td>
                  </tr>
                ) : responses.length === 0 ? (
                  <tr>
                    <td colSpan={fields.length + 3} className="text-center py-8 text-gray-400">
                      Nenhuma resposta ainda
                    </td>
                  </tr>
                ) : (
                  responses.map((response) => (
                    <tr key={response.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(response.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={response.status === 'complete' ? 'success' : 'warning'}>
                          {response.status === 'complete' ? 'Completa' : 'Parcial'}
                        </Badge>
                      </td>
                      {fields.slice(0, 5).map((f: any) => (
                        <td key={f.id} className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">
                          {getAnswerValue(response, f.id)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedResponse(response); setView('card') }}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => deleteResponse(response.id)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  {pagination.total} respostas
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page <= 1}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card View */}
        {view === 'card' && (
          <div>
            {selectedResponse ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-base">Resposta</CardTitle>
                      <Badge variant={selectedResponse.status === 'complete' ? 'success' : 'warning'}>
                        {selectedResponse.status === 'complete' ? 'Completa' : 'Parcial'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const idx = responses.indexOf(selectedResponse)
                          if (idx > 0) setSelectedResponse(responses[idx - 1])
                        }}
                        disabled={responses.indexOf(selectedResponse) === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="text-sm text-gray-500">
                        {responses.indexOf(selectedResponse) + 1} / {responses.length}
                      </span>
                      <button
                        onClick={() => {
                          const idx = responses.indexOf(selectedResponse)
                          if (idx < responses.length - 1) setSelectedResponse(responses[idx + 1])
                        }}
                        disabled={responses.indexOf(selectedResponse) === responses.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Metadata */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-400">Data</p>
                      <p className="text-sm font-medium">{formatDate(selectedResponse.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Duração</p>
                      <p className="text-sm font-medium">
                        {selectedResponse.durationSeconds
                          ? `${Math.round(selectedResponse.durationSeconds / 60)}min ${selectedResponse.durationSeconds % 60}s`
                          : '-'}
                      </p>
                    </div>
                    {selectedResponse.metadata?.utm_source && (
                      <div>
                        <p className="text-xs text-gray-400">UTM Source</p>
                        <p className="text-sm font-medium">{selectedResponse.metadata.utm_source}</p>
                      </div>
                    )}
                    {selectedResponse.metadata?.utm_campaign && (
                      <div>
                        <p className="text-xs text-gray-400">UTM Campaign</p>
                        <p className="text-sm font-medium">{selectedResponse.metadata.utm_campaign}</p>
                      </div>
                    )}
                  </div>

                  {/* Answers */}
                  <div className="space-y-4">
                    {selectedResponse.answers
                      ?.sort((a: any, b: any) => (a.field?.order || 0) - (b.field?.order || 0))
                      .map((answer: any) => (
                        <div key={answer.id} className="flex items-start gap-4">
                          <div className="flex-1">
                            <p className="text-xs text-gray-400 mb-1">
                              {answer.field?.title || 'Campo removido'}
                            </p>
                            <p className="text-sm font-medium text-gray-900">
                              {typeof answer.value === 'object'
                                ? JSON.stringify(answer.value)
                                : String(answer.value)}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            {answer.field?.type === 'email' && answer.value && (
                              <a
                                href={`mailto:${answer.value}`}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-500"
                              >
                                <Mail size={14} />
                              </a>
                            )}
                            {answer.field?.type === 'phone' && answer.value && (
                              <a
                                href={`https://wa.me/55${String(answer.value).replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-green-500"
                              >
                                <Phone size={14} />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Eye size={32} className="mx-auto mb-2" />
                <p>Selecione uma resposta na tabela para visualizar</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setView('table')}
                >
                  Ver tabela
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
