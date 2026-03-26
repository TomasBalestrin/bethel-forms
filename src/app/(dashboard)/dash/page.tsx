'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FileText, LogOut, Link2, BarChart3, Copy, Trash2 } from 'lucide-react'

interface FormItem {
  id: string
  name: string
  slug: string
  status: string
  createdAt: string
  _count?: { responses: number }
}

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession()
  const router = useRouter()
  const [forms, setForms] = useState<FormItem[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    }
    if (authStatus === 'authenticated') {
      fetchForms()
    }
  }, [authStatus, router])

  async function fetchForms() {
    try {
      const res = await fetch('/api/forms')
      if (res.ok) {
        const data = await res.json()
        setForms(data)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setLoading(false)
    }
  }

  async function createForm() {
    if (creating) return
    setCreating(true)
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Novo Formulário' }),
      })

      if (res.ok) {
        const form = await res.json()
        router.push(`/form/${form.id}/edit`)
      }
    } catch (error) {
      console.error('Error creating form:', error)
    } finally {
      setCreating(false)
    }
  }

  async function duplicateForm(id: string) {
    try {
      const res = await fetch(`/api/forms/${id}/duplicate`, { method: 'POST' })
      if (res.ok) {
        fetchForms()
      }
    } catch (error) {
      console.error('Error duplicating form:', error)
    }
  }

  async function deleteForm(id: string) {
    if (!confirm('Tem certeza que deseja excluir este formulário? Todas as respostas serão perdidas.')) return
    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setForms(prev => prev.filter((f) => f.id !== id))
      } else {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Erro ao excluir formulário')
      }
    } catch (error) {
      console.error('Error deleting form:', error)
      alert('Erro de conexão ao excluir formulário')
    }
  }

  const filteredForms = forms.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/dash" className="text-lg font-bold text-gray-900">
            Bethel<span className="text-blue-600">Forms</span>
          </Link>
          {session?.user?.name && (
            <span className="text-xs text-gray-400 hidden sm:inline">
              {session.user.name}
            </span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Search + Create */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Pesquisar formulário"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11 h-11 bg-white border-gray-200 rounded-lg text-base sm:text-sm"
            />
          </div>
          <button
            onClick={createForm}
            disabled={creating}
            className="flex items-center gap-2 px-4 h-11 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Plus size={16} />
            {creating ? 'Criando...' : 'Criar novo'}
          </button>
        </div>

        {/* Forms List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'Nenhum formulário encontrado' : 'Crie seu primeiro formulário'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm">
              {search
                ? 'Tente buscar com outros termos'
                : 'Comece criando um formulário para capturar leads'}
            </p>
            {!search && (
              <button
                onClick={createForm}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} />
                Criar novo
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredForms.map((form) => {
              const responseCount = form._count?.responses || 0
              return (
                <div
                  key={form.id}
                  className="flex items-center gap-5 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all group"
                >
                  {/* Thumbnail — clickable */}
                  <Link href={`/form/${form.id}/edit`} className="hidden sm:flex w-28 h-20 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0 items-center justify-center overflow-hidden">
                    <div className="text-center px-2">
                      <div className="w-8 h-0.5 bg-blue-400/60 rounded mb-1.5 mx-auto" />
                      <div className="w-16 h-0.5 bg-white/30 rounded mb-1" />
                      <div className="w-14 h-0.5 bg-white/20 rounded mb-1" />
                      <div className="w-12 h-0.5 bg-white/15 rounded mb-2" />
                      <div className="w-10 h-2 bg-blue-500/40 rounded mx-auto" />
                    </div>
                  </Link>

                  {/* Info — clickable */}
                  <Link href={`/form/${form.id}/edit`} className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 truncate transition-colors">
                      {form.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">
                      {responseCount > 0
                        ? `${responseCount} ${responseCount === 1 ? 'resposta' : 'respostas'}`
                        : 'Nenhuma resposta'}
                    </p>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(`${window.location.origin}/${form.slug}`)
                        const btn = e.currentTarget
                        btn.title = 'Copiado!'
                        setTimeout(() => { btn.title = 'Copiar link' }, 1500)
                      }}
                      title="Copiar link"
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Link2 size={15} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        duplicateForm(form.id)
                      }}
                      title="Duplicar"
                      className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                      <Copy size={15} />
                    </button>
                    <Link
                      href={`/form/${form.id}/responses`}
                      title="Ver respostas"
                      className="p-2 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <BarChart3 size={15} />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteForm(form.id)
                      }}
                      title="Excluir formulário"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    {form.status === 'published' ? (
                      <Badge variant="success">Publicado</Badge>
                    ) : (
                      <Badge variant="secondary">Rascunho</Badge>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
