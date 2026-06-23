'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// As Configuracoes agora vivem num overlay dentro do editor (UI unica).
// Esta rota redireciona pro editor com o overlay aberto.
export default function FormSettingsRedirect() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string

  useEffect(() => {
    router.replace(`/form/${formId}/edit?config=1`)
  }, [formId, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}
