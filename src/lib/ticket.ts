// Composição client-side do ingresso/ticket (thanksType === 'ticket').
// Desenha arte-fundo 1080x1440 + QR code posicionado + valor de um campo
// como texto sob o QR. Usado tanto no preview do builder quanto no render
// público. Nada aqui roda no server (usa <canvas>).

import type { FieldAlign } from '@/types'

export const TICKET_W = 1080
export const TICKET_H = 1440

export type QrVertical = 'top' | 'middle' | 'bottom'

const PADDING = 64
const TEXT_RESERVE = 96 // espaço reservado pro texto sob o QR (modo bottom)
const TEXT_GAP = 56 // distância do fim do QR até a baseline do texto
const QR_DEFAULT_SIZE = 320

// Âncora do QR sobre o canvas 1080x1440.
export function computeQrRect(
  size: number,
  vertical: QrVertical = 'middle',
  horizontal: FieldAlign = 'center'
): { x: number; y: number } {
  let x = (TICKET_W - size) / 2
  if (horizontal === 'left') x = PADDING
  else if (horizontal === 'right') x = TICKET_W - size - PADDING

  let y = (TICKET_H - size) / 2
  if (vertical === 'top') y = PADDING
  else if (vertical === 'bottom') y = TICKET_H - size - TEXT_RESERVE - PADDING

  return { x, y }
}

function loadImage(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = crossOrigin
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Falha ao carregar imagem: ${src}`))
    img.src = src
  })
}

export interface DrawTicketOpts {
  bgUrl: string
  qrDataUrl: string
  size?: number
  vertical?: QrVertical
  horizontal?: FieldAlign
  text?: string
  textColor?: string
}

// Desenha o ingresso completo no canvas fornecido. Resolve quando pronto.
// O fundo usa crossOrigin='anonymous' pra não "tingir" (taint) o canvas —
// senão canvas.toBlob/toDataURL lançam SecurityError.
export async function drawTicket(
  canvas: HTMLCanvasElement,
  opts: DrawTicketOpts
): Promise<void> {
  const { bgUrl, qrDataUrl, text, textColor = '#111827' } = opts
  const size = opts.size || QR_DEFAULT_SIZE
  const vertical = opts.vertical || 'middle'
  const horizontal = opts.horizontal || 'center'

  canvas.width = TICKET_W
  canvas.height = TICKET_H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context indisponível')

  // Fundo neutro caso a arte não cubra tudo
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, TICKET_W, TICKET_H)

  const bg = await loadImage(bgUrl, 'anonymous')
  ctx.drawImage(bg, 0, 0, TICKET_W, TICKET_H)

  const qr = await loadImage(qrDataUrl)
  const { x, y } = computeQrRect(size, vertical, horizontal)
  ctx.drawImage(qr, x, y, size, size)

  const label = (text || '').trim()
  if (label) {
    ctx.fillStyle = textColor
    ctx.font = '600 40px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText(label, x + size / 2, y + size + TEXT_GAP, TICKET_W - PADDING * 2)
  }
}
