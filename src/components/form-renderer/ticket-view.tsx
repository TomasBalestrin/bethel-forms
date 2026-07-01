'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { drawTicket, type QrVertical } from '@/lib/ticket'
import type { FormFieldSettings, FieldAlign } from '@/types'

interface TicketViewProps {
  responseId: string | null
  answers: Record<string, any>
  settings: FormFieldSettings
  buttonStyle?: React.CSSProperties
}

// Coage o valor respondido em texto de uma linha pro rótulo sob o QR.
function coerceValue(v: any): string {
  if (v == null) return ''
  if (Array.isArray(v)) {
    return v
      .map((x) => (x && typeof x === 'object' ? x.label ?? x.value ?? '' : x))
      .filter(Boolean)
      .join(', ')
  }
  if (typeof v === 'object') return v.label ?? v.value ?? ''
  return String(v)
}

export function TicketView({ responseId, answers, settings, buttonStyle }: TicketViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  const bgUrl = settings.ticketBackgroundUrl || ''
  const size = settings.ticketQrSize || 320
  const vertical = (settings.ticketQrVertical || 'middle') as QrVertical
  const horizontal = (settings.ticketQrHorizontal || 'center') as FieldAlign
  const textColor = settings.ticketTextColor || '#111827'
  const label = settings.ticketFieldId ? coerceValue(answers[settings.ticketFieldId]) : ''
  const downloadText = settings.ticketDownloadText || 'Baixar ingresso'

  useEffect(() => {
    let cancelled = false
    async function build() {
      const canvas = canvasRef.current
      if (!canvas || !responseId || !bgUrl) {
        setStatus('error')
        return
      }
      setStatus('loading')
      try {
        const qrDataUrl = await QRCode.toDataURL(responseId, { margin: 1, width: size })
        await drawTicket(canvas, {
          bgUrl,
          qrDataUrl,
          size,
          vertical,
          horizontal,
          text: label,
          textColor,
        })
        if (cancelled) return
        setPreviewUrl(canvas.toDataURL('image/png'))
        setStatus('ready')
      } catch (err) {
        console.error('Erro ao gerar ingresso:', err)
        if (!cancelled) setStatus('error')
      }
    }
    build()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responseId, bgUrl, size, vertical, horizontal, label, textColor])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'ingresso.png'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  // Sem arte ou sem responseId → não renderiza o ingresso (parent mostra o
  // texto de obrigado normalmente).
  if (!bgUrl || !responseId) return null

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      {/* Canvas de composição — oculto; fonte pro preview e pro download */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {status === 'error' ? (
        <p className="text-sm text-gray-500">Não foi possível gerar o ingresso.</p>
      ) : (
        <>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Ingresso"
              className="w-full max-w-sm rounded-lg shadow-md"
            />
          )}
          <button
            type="button"
            onClick={handleDownload}
            disabled={status !== 'ready'}
            className="inline-block px-6 py-3 rounded-lg text-white font-medium min-h-[48px] disabled:opacity-60"
            style={buttonStyle}
          >
            {downloadText}
          </button>
        </>
      )}
    </div>
  )
}
