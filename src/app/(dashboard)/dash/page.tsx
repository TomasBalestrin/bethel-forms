'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'
import { FormCard } from '@/components/dashboard/form-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, FileText, BarChart3, Inbox } from 'lucide-react'

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
    if (!confirm('Tem certeza que deseja excluir este formulário?')) return

    try {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setForms(forms.filter((f) => f.id !== id))
      }
    } catch (error) {
      console.error('Error deleting form:', error)
    }
  }

  const filteredForms = forms.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalResponses = forms.reduce(
    (sum, f) => sum + (f._count?.responses || 0),
    0
  )

  const activeForms = forms.filter((f) => f.status === 'published').length

  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-64 p-8">
        <Header title="Dashboard" />

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeForms}</p>
                <p className="text-sm text-gray-500">Formulários ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalResponses}</p>
                <p className="text-sm text-gray-500">Respostas no mês</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Inbox className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
                <p className="text-sm text-gray-500">Total de formulários</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar formulários..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button onClick={createForm}>
            <Plus size={18} className="mr-2" />
            Novo Formulário
          </Button>
        </div>

        {/* Forms Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredForms.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {search ? 'Nenhum formulário encontrado' : 'Crie seu primeiro formulário'}
            </h3>
            <p className="text-gray-500 mb-6">
              {search
                ? 'Tente buscar com outros termos'
                : 'Comece criando um formulário para capturar leads'}
            </p>
            {!search && (
              <Button onClick={createForm}>
                <Plus size={18} className="mr-2" />
                Novo Formulário
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredForms.map((form) => (
              <FormCard
                key={form.id}
                form={form}
                onDuplicate={duplicateForm}
                onDelete={deleteForm}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
