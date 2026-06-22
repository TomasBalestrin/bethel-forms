'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Zap, RefreshCw, ChevronDown, ChevronRight, X } from 'lucide-react'

interface Webhook {
  id: string
  url: string
  name: string | null
  active: boolean
  headers: Record<string, string>
}

interface WebhookLog {
  id: string
  webhook_id: string
  response_id: string
  status_code: number | null
  error: string | null
  attempt: number
  sent_at: string
  response_body: string | null
  webhooks?: { url: string; name: string | null }
}

export function WebhooksSection({ formId, embedded = false }: { formId: string; embedded?: boolean }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [showLogs, setShowLogs] = useState(false)

  // form de novo webhook
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [headerRows, setHeaderRows] = useState<{ key: string; value: string }[]>([])
  const [error, setError] = useState('')
  const [testing, setTesting] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, string>>({})

  useEffect(() => {
    load()
  }, [formId])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/forms/${formId}/webhooks`)
    if (res.ok) setWebhooks((await res.json()).webhooks)
    setLoading(false)
  }

  async function create() {
    setError('')
    if (!url.trim()) {
      setError('URL é obrigatória')
      return
    }
    const headers: Record<string, string> = {}
    for (const r of headerRows) if (r.key.trim()) headers[r.key.trim()] = r.value
    const res = await fetch(`/api/forms/${formId}/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim(), name: name.trim() || null, headers }),
    })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Erro ao criar')
      return
    }
    setUrl('')
    setName('')
    setHeaderRows([])
    setAdding(false)
    load()
  }

  async function toggleActive(wh: Webhook) {
    await fetch(`/api/forms/${formId}/webhooks/${wh.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !wh.active }),
    })
    setWebhooks((prev) => prev.map((w) => (w.id === wh.id ? { ...w, active: !w.active } : w)))
  }

  async function remove(id: string) {
    if (!confirm('Excluir este webhook? Os logs também serão removidos.')) return
    await fetch(`/api/forms/${formId}/webhooks/${id}`, { method: 'DELETE' })
    setWebhooks((prev) => prev.filter((w) => w.id !== id))
  }

  async function test(id: string) {
    setTesting(id)
    setTestResult((p) => ({ ...p, [id]: '' }))
    const res = await fetch(`/api/forms/${formId}/webhooks/${id}/test`, { method: 'POST' })
    const d = await res.json().catch(() => ({}))
    setTestResult((p) => ({
      ...p,
      [id]: d.ok ? `OK (${d.statusCode})` : `Falhou: ${d.error || d.statusCode || 'erro'}`,
    }))
    setTesting(null)
  }

  return (
    <div className={embedded ? '' : 'mb-12'}>
      {!embedded && (
        <>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Webhooks</h2>
          <p className="text-sm text-gray-500 mb-6">
            Cada lead completo é enviado via POST para as URLs configuradas.
          </p>
        </>
      )}
      {embedded && (
        <p className="text-xs text-gray-500 mb-3">
          Cada lead completo dispara um POST para as URLs abaixo.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {webhooks.length === 0 && !adding && (
            <p className="text-sm text-gray-400">Nenhum webhook configurado.</p>
          )}

          {webhooks.map((wh) => (
            <div key={wh.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {wh.name && <p className="text-sm font-medium text-gray-900">{wh.name}</p>}
                  <p className="text-xs text-gray-500 break-all font-mono">{wh.url}</p>
                  {wh.headers && Object.keys(wh.headers).length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {Object.keys(wh.headers).length} header(s) custom
                    </p>
                  )}
                  {testResult[wh.id] && (
                    <p
                      className={`text-xs mt-1 ${
                        testResult[wh.id].startsWith('OK') ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {testResult[wh.id]}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => test(wh.id)}
                    disabled={testing === wh.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                    title="Testar"
                  >
                    <Zap size={12} />
                    {testing === wh.id ? '...' : 'Testar'}
                  </button>
                  <button
                    onClick={() => toggleActive(wh)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      wh.active ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    title={wh.active ? 'Ativo' : 'Inativo'}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
                        wh.active ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => remove(wh.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {adding ? (
            <div className="border border-blue-200 rounded-lg p-4 space-y-3 bg-blue-50/30">
              <Input placeholder="https://seu-destino.com/webhook" value={url} onChange={(e) => setUrl(e.target.value)} />
              <Input placeholder="Nome (opcional)" value={name} onChange={(e) => setName(e.target.value)} />

              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">Headers customizados (ex: Authorization)</p>
                {headerRows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="Header"
                      value={r.key}
                      onChange={(e) =>
                        setHeaderRows((prev) => prev.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))
                      }
                      className="flex-1"
                    />
                    <Input
                      placeholder="Valor"
                      value={r.value}
                      onChange={(e) =>
                        setHeaderRows((prev) => prev.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                      }
                      className="flex-1"
                    />
                    <button
                      onClick={() => setHeaderRows((prev) => prev.filter((_, j) => j !== i))}
                      className="p-1.5 text-gray-400 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setHeaderRows((prev) => [...prev, { key: '', value: '' }])}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Adicionar header
                </button>
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex items-center gap-2">
                <button
                  onClick={create}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Salvar webhook
                </button>
                <button
                  onClick={() => {
                    setAdding(false)
                    setError('')
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAdding(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50"
            >
              <Plus size={14} />
              Adicionar webhook
            </button>
          )}

          {/* Logs */}
          <div className="pt-4">
            <button
              onClick={() => setShowLogs((s) => !s)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showLogs ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Logs de envio
            </button>
            {showLogs && <WebhookLogs formId={formId} />}
          </div>
        </div>
      )}
    </div>
  )
}

function WebhookLogs({ formId }: { formId: string }) {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'' | 'success' | 'failed'>('')
  const [resending, setResending] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [filter])

  async function load() {
    setLoading(true)
    const q = filter ? `?status=${filter}` : ''
    const res = await fetch(`/api/forms/${formId}/webhooks/logs${q}`)
    if (res.ok) setLogs((await res.json()).logs)
    setLoading(false)
  }

  async function resend(responseId: string) {
    setResending(responseId)
    await fetch(`/api/forms/${formId}/webhooks/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseId }),
    })
    setResending(null)
    load()
  }

  function statusBadge(log: WebhookLog) {
    const ok = log.status_code !== null && log.status_code >= 200 && log.status_code < 300
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {ok ? log.status_code : log.error || log.status_code || 'falha'}
      </span>
    )
  }

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-3">
        {(['', 'success', 'failed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 text-xs rounded-md border ${
              filter === f ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600'
            }`}
          >
            {f === '' ? 'Todos' : f === 'success' ? 'Sucesso' : 'Falha'}
          </button>
        ))}
        <button onClick={load} className="ml-auto p-1.5 text-gray-400 hover:text-gray-700" title="Atualizar">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : logs.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum envio registrado.</p>
      ) : (
        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-96 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center gap-3 px-3 py-2 text-xs">
              <span className="text-gray-400 whitespace-nowrap">
                {new Date(log.sent_at).toLocaleString('pt-BR')}
              </span>
              {statusBadge(log)}
              <span className="text-gray-500 truncate flex-1 font-mono">
                {log.webhooks?.name || log.webhooks?.url || log.webhook_id}
              </span>
              {log.attempt > 1 && <span className="text-gray-400">#{log.attempt}</span>}
              <button
                onClick={() => resend(log.response_id)}
                disabled={resending === log.response_id}
                className="flex items-center gap-1 px-2 py-0.5 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 disabled:opacity-50"
              >
                <RefreshCw size={11} />
                {resending === log.response_id ? '...' : 'Reenviar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
