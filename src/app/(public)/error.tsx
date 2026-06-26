'use client'

import { useEffect } from 'react'

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[public-form-error]', error)
    try {
      fetch('/api/public/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error?.message,
          digest: error?.digest,
          stack: error?.stack,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          url: typeof location !== 'undefined' ? location.href : '',
        }),
        keepalive: true,
      }).catch(() => {})
    } catch {}
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Não foi possível carregar o formulário
        </h1>
        <p className="text-gray-500 mb-6">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
        <button
          onClick={() => reset()}
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
