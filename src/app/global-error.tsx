'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
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
          scope: 'global',
        }),
        keepalive: true,
      }).catch(() => {})
    } catch {}
  }, [error])

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: '#f9fafb',
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: '24rem' }}>
            <h1
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#111827',
                marginBottom: '0.5rem',
              }}
            >
              Algo deu errado
            </h1>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Ocorreu um erro inesperado. Tente novamente.
            </p>
            <button
              onClick={() => reset()}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
