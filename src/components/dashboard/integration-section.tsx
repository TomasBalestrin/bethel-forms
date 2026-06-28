'use client'

import { useEffect, useState } from 'react'
import {
  Zap,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { computeFieldsSignature } from '@/lib/hub/signature'
import type { FormIntegration } from '@/types'

interface Opt {
  id: string
  nome: string
  ordem?: number
}

interface HubLogRow {
  id: string
  response_id: string | null
  is_test: boolean
  status_code: number | null
  acao: string | null
  error: string | null
  event_id: string | null
  sent_at: string
}

export function IntegrationSection({ formId }: { formId: string }) {
  const [loading, setLoading] = useState(true)
  const [integration, setIntegration] = useState<FormIntegration>({})
  const [currentSignature, setCurrentSignature] = useState('')
  const [grupos, setGrupos] = useState<Opt[]>([])
  const [etapas, setEtapas] = useState<Opt[]>([])
  const [loadingGrupos, setLoadingGrupos] = useState(false)
  const [loadingEtapas, setLoadingEtapas] = useState(false)
  const [hubError, setHubError] = useState('')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState('')
  const [showLogs, setShowLogs] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formId])

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/forms/${formId}`)
    if (res.ok) {
      const form = await res.json()
      const integ: FormIntegration = form.settings?.integration || {}
      setIntegration(integ)
      const qFields = (form.fields || []).map((f: any) => ({ id: f.id, type: f.type, title: f.title }))
      setCurrentSignature(computeFieldsSignature(qFields))
      if (integ.enabled) {
        loadGrupos()
        if (integ.grupo_id) loadEtapas(integ.grupo_id)
      }
    }
    setLoading(false)
  }

  async function loadGrupos() {
    setLoadingGrupos(true)
    setHubError('')
    const res = await fetch('/api/hub/grupos')
    const d = await res.json().catch(() => ({}))
    if (res.ok) setGrupos(d.data || [])
    else setHubError(d.error || 'Erro ao carregar grupos')
    setLoadingGrupos(false)
  }

  async function loadEtapas(grupoId: string) {
    setLoadingEtapas(true)
    const res = await fetch(`/api/hub/grupos/${grupoId}/etapas`)
    const d = await res.json().catch(() => ({}))
    if (res.ok) setEtapas(d.data || [])
    else setEtapas([])
    setLoadingEtapas(false)
  }

  async function save(patch: Partial<FormIntegration>) {
    const res = await fetch(`/api/forms/${formId}/integration`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    const d = await res.json().catch(() => ({}))
    if (res.ok && d.integration) setIntegration(d.integration)
    return res.ok
  }

  async function toggleEnabled() {
    const next = !integration.enabled
    setIntegration((p) => ({ ...p, enabled: next }))
    await save({ enabled: next })
    if (next && grupos.length === 0) loadGrupos()
  }

  async function onSelectGrupo(grupoId: string) {
    const grupo = grupos.find((g) => g.id === grupoId)
    setIntegration((p) => ({
      ...p,
      grupo_id: grupoId || null,
      grupo_nome: grupo?.nome || null,
      etapa_id: null,
      etapa_nome: null,
      tested_at: null,
      fields_signature: null,
    }))
    setEtapas([])
    setTestResult('')
    await save({ grupo_id: grupoId || null, grupo_nome: grupo?.nome || null, etapa_id: null, etapa_nome: null })
    if (grupoId) loadEtapas(grupoId)
  }

  async function onSelectEtapa(etapaId: string) {
    const etapa = etapas.find((e) => e.id === etapaId)
    setIntegration((p) => ({
      ...p,
      etapa_id: etapaId || null,
      etapa_nome: etapa?.nome || null,
      tested_at: null,
      fields_signature: null,
    }))
    setTestResult('')
    await save({ etapa_id: etapaId || null, etapa_nome: etapa?.nome || null })
  }

  async function test() {
    setTesting(true)
    setTestResult('')
    const res = await fetch(`/api/forms/${formId}/integration/test`, { method: 'POST' })
    const d = await res.json().catch(() => ({}))
    setTesting(false)
    if (res.ok && d.ok) {
      setTestResult(`OK${d.acao ? ' · ' + d.acao : ''}${d.statusCode ? ' (' + d.statusCode + ')' : ''}`)
      load() // refetch p/ pegar tested_at + assinatura armada
    } else {
      setTestResult(`Falhou: ${d.error || d.statusCode || 'erro'}`)
    }
  }

  const schemaChanged =
    !!integration.tested_at && !!integration.fields_signature && currentSignature !== integration.fields_signature
  const neverTested = !integration.tested_at
  const armed = !!integration.enabled && !!integration.grupo_id && !!integration.tested_at && !schemaChanged
  const needsTest = !!integration.enabled && !!integration.grupo_id && (neverTested || schemaChanged)

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="text-lg font-bold text-gray-900">Integrações</h2>
        <button
          type="button"
          onClick={toggleEnabled}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
            integration.enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
          title={integration.enabled ? 'Ativa' : 'Inativa'}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${
              integration.enabled ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Envia cada lead completo para o Hub (Bethel Base). Cada pergunta do formulário vira um campo do lead.
      </p>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : !integration.enabled ? (
        <p className="text-sm text-gray-400">Ative para configurar o destino dos leads.</p>
      ) : (
        <div className="space-y-4">
          {hubError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{hubError}</span>
            </div>
          )}

          {/* Grupo */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Grupo</label>
            <select
              value={integration.grupo_id || ''}
              onChange={(e) => onSelectGrupo(e.target.value)}
              disabled={loadingGrupos}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm disabled:opacity-50"
            >
              <option value="">{loadingGrupos ? 'Carregando...' : 'Selecione um grupo...'}</option>
              {grupos.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Etapa */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Etapa (opcional)</label>
            <select
              value={integration.etapa_id || ''}
              onChange={(e) => onSelectEtapa(e.target.value)}
              disabled={!integration.grupo_id || loadingEtapas}
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm disabled:opacity-50"
            >
              <option value="">{loadingEtapas ? 'Carregando...' : 'Nenhuma (deixa o Hub decidir)'}</option>
              {etapas.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Estado: precisa testar / ativo */}
          {needsTest && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                {schemaChanged
                  ? 'O formulário mudou desde o último teste. Os envios estão pausados — teste a integração novamente para retomar.'
                  : 'Teste a integração antes de enviar leads ao Hub.'}
              </span>
            </div>
          )}
          {armed && (
            <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
              <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
              <span>
                Integração testada e ativa. Enviando leads para{' '}
                <strong>{integration.grupo_nome || 'grupo'}</strong>
                {integration.etapa_nome ? (
                  <>
                    {' '}
                    · <strong>{integration.etapa_nome}</strong>
                  </>
                ) : null}
                .
              </span>
            </div>
          )}

          {/* Testar */}
          <div className="flex items-center gap-3">
            <button
              onClick={test}
              disabled={testing || !integration.grupo_id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Zap size={14} />
              {testing ? 'Enviando teste...' : 'Testar integração'}
            </button>
            {testResult && (
              <span className={`text-xs ${testResult.startsWith('OK') ? 'text-green-600' : 'text-red-600'}`}>
                {testResult}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400">
            O teste envia um lead real com as perguntas deste formulário preenchidas com dados fictícios.
          </p>

          {/* Logs */}
          <div className="pt-2">
            <button
              onClick={() => setShowLogs((s) => !s)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              {showLogs ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              Logs de envio
            </button>
            {showLogs && <HubLogs formId={formId} />}
          </div>
        </div>
      )}
    </div>
  )
}

function HubLogs({ formId }: { formId: string }) {
  const [logs, setLogs] = useState<HubLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'' | 'success' | 'failed'>('')

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function load() {
    setLoading(true)
    const q = filter ? `?status=${filter}` : ''
    const res = await fetch(`/api/forms/${formId}/hub/logs${q}`)
    if (res.ok) setLogs((await res.json()).logs)
    setLoading(false)
  }

  function statusBadge(log: HubLogRow) {
    const ok = log.status_code !== null && log.status_code >= 200 && log.status_code < 300
    return (
      <span
        className={`px-2 py-0.5 rounded text-xs font-medium ${
          ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}
      >
        {ok ? log.acao || log.status_code : log.error || log.status_code || 'falha'}
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
              {log.is_test && (
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">teste</span>
              )}
              <span className="text-gray-500 truncate flex-1 font-mono">{log.event_id || log.response_id || '—'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
