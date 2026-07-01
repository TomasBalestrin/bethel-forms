'use client'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, QrCode } from 'lucide-react'
import { getFieldAlignment, alignToJustify } from '@/lib/field-alignment'

// Posição aproximada (CSS) do QR sobre a arte, pro preview do builder.
// Espelha a matemática de src/lib/ticket.ts sobre um mock com aspect 1080/1440.
function ticketQrBoxStyle(settings: any): React.CSSProperties {
  const sizePct = ((settings.ticketQrSize || 320) / 1080) * 100
  const padX = (64 / 1080) * 100
  const padY = (64 / 1440) * 100
  const h = settings.ticketQrHorizontal || 'center'
  const v = settings.ticketQrVertical || 'middle'
  const style: React.CSSProperties = { position: 'absolute', width: `${sizePct}%`, aspectRatio: '1 / 1' }
  const transforms: string[] = []
  if (h === 'left') style.left = `${padX}%`
  else if (h === 'right') style.right = `${padX}%`
  else { style.left = '50%'; transforms.push('translateX(-50%)') }
  if (v === 'top') style.top = `${padY}%`
  else if (v === 'bottom') style.bottom = `${padY}%`
  else { style.top = '50%'; transforms.push('translateY(-50%)') }
  if (transforms.length) style.transform = transforms.join(' ')
  // Borda do QR — escalada do canvas 1080 pro mock (w-40 = 160px).
  const scale = 160 / 1080
  const bw = (settings.ticketQrBorderWidth || 0) * scale
  const br = (settings.ticketQrBorderRadius || 0) * scale
  if (bw > 0) {
    style.border = `${bw}px solid ${settings.ticketQrBorderColor || '#111827'}`
    style.boxSizing = 'border-box'
  }
  if (br > 0) style.borderRadius = `${br}px`
  return style
}

// Posição (CSS) do rótulo no mock, relativa à caixa do QR.
function ticketLabelStyle(settings: any): React.CSSProperties {
  const color = settings.ticketTextColor || '#111827'
  if ((settings.ticketLabelPosition || 'below') === 'side') {
    const v = settings.ticketLabelVertical || 'middle'
    const s: React.CSSProperties = { position: 'absolute', left: '100%', marginLeft: '3px', color }
    if (v === 'top') s.top = '0'
    else if (v === 'bottom') s.bottom = '0'
    else { s.top = '50%'; s.transform = 'translateY(-50%)' }
    return s
  }
  return {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '2px',
    color,
  }
}

interface FieldPreviewProps {
  field: any
  primaryColor?: string
  appearance?: {
    textColor?: string
    primaryColor?: string
    backgroundColor?: string
    titleFontSize?: string
    titleFontWeight?: string
    descriptionFontSize?: string
    descriptionFontWeight?: string
    answerFontSize?: string
    answerFontWeight?: string
    [key: string]: any
  }
}

export function FieldPreview({ field, primaryColor: primaryColorProp = '#2563eb', appearance = {} }: FieldPreviewProps) {
  if (!field) return null

  const settings = field.settings || {}
  const primaryColor = appearance.primaryColor || primaryColorProp
  const textColor = appearance.textColor || '#111827'
  const descriptionColor = appearance.descriptionColor || '#6b7280'
  const optionColor = appearance.optionColor || '#d1d5db'

  const align = getFieldAlignment(field)
  const titleStyle: React.CSSProperties = { color: textColor, textAlign: align.title }
  const descStyle: React.CSSProperties = { color: descriptionColor, textAlign: align.description }
  const elementsStyle: React.CSSProperties = { textAlign: align.elements }
  const answerStyle: React.CSSProperties = {}
  const buttonStyle: React.CSSProperties = {
    backgroundColor: appearance.buttonColor || primaryColor,
    color: appearance.buttonTextColor || '#ffffff',
    borderRadius: appearance.buttonRadius || undefined,
    fontSize: appearance.buttonSize === 'sm' ? '14px' : appearance.buttonSize === 'lg' ? '18px' : undefined,
  }

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[400px] p-8"
      style={{ fontFamily: appearance.fontFamily || undefined, fontSize: appearance.baseFontSize || undefined }}
    >
      <div className="w-full max-w-lg">
        {/* Welcome */}
        {field.type === 'welcome' && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={titleStyle}>{field.title || 'Bem-vindo!'}</h2>
            <p className="mb-6 whitespace-pre-line" style={descStyle}>{field.description || 'Preencha o formulário'}</p>
            <div style={elementsStyle}>
              <button
                className="px-8 py-3 rounded-lg text-white font-medium"
                style={buttonStyle}
              >
                Começar
              </button>
            </div>
          </div>
        )}

        {/* Short Text */}
        {field.type === 'short_text' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Pergunta'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <Input placeholder={field.placeholder || 'Digite sua resposta...'} disabled style={answerStyle} />
          </div>
        )}

        {/* Long Text */}
        {field.type === 'long_text' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Resposta longa'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <Textarea placeholder={field.placeholder || 'Digite sua resposta...'} disabled style={answerStyle} rows={4} />
          </div>
        )}

        {/* Email */}
        {field.type === 'email' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Seu email'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <Input type="email" placeholder={field.placeholder || 'nome@email.com'} disabled style={answerStyle} />
          </div>
        )}

        {/* Phone */}
        {field.type === 'phone' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Seu telefone'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <Input type="tel" placeholder={field.placeholder || '(11) 99999-9999'} disabled style={answerStyle} />
          </div>
        )}

        {/* CPF */}
        {field.type === 'cpf' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Seu CPF'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <Input type="text" placeholder={field.placeholder || '000.000.000-00'} disabled style={answerStyle} />
          </div>
        )}

        {/* Number */}
        {field.type === 'number' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Número'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <Input type="number" placeholder={field.placeholder || 'Digite um número...'} disabled style={answerStyle} />
          </div>
        )}

        {/* Multiple Choice */}
        {field.type === 'multiple_choice' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Escolha uma opção'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <div className="space-y-2">
              {(settings.options || [{ id: '1', label: 'Opção 1' }, { id: '2', label: 'Opção 2' }]).map(
                (option: any, i: number) => {
                  const letter = String.fromCharCode(65 + i)
                  return (
                    <div
                      key={option.id || i}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
                      style={{ border: `1px solid ${optionColor}` }}
                    >
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                        style={{ border: `2px solid ${optionColor}`, color: textColor }}
                      >
                        {letter}
                      </span>
                      <span style={{ color: textColor, ...answerStyle }}>{option.label}</span>
                    </div>
                  )
                }
              )}
              {settings.allowOther && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl border-dashed"
                  style={{ border: `1px dashed ${optionColor}` }}
                >
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{ border: `2px solid ${optionColor}`, color: textColor }}
                  >
                    ?
                  </span>
                  <span style={{ color: optionColor }}>Outro...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Satisfaction Scale */}
        {field.type === 'satisfaction_scale' && (
          <div>
            <h2 className="text-xl font-semibold mb-1" style={titleStyle}>
              {field.title || 'Como você avalia?'}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </h2>
            {field.description && <p className="text-sm mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            <div className={cn('flex gap-2 my-4', alignToJustify[align.elements])}>
              {Array.from(
                { length: Math.max(0, (settings.scaleMax ?? 10) - (settings.scaleMin ?? 0) + 1) },
                (_, i) => (settings.scaleMin ?? 0) + i
              ).map((num) => (
                <button
                  key={num}
                  className="w-10 h-10 rounded-lg border border-gray-300 text-sm font-medium hover:border-blue-400 hover:bg-blue-50"
                  style={{ color: textColor }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>{settings.scaleMinLabel || ''}</span>
              <span>{settings.scaleMaxLabel || ''}</span>
            </div>
          </div>
        )}

        {/* Message */}
        {field.type === 'message' && (
          <div>
            <div style={elementsStyle}>
              <MessageSquare className="inline-block mb-4 text-gray-400" size={36} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={titleStyle}>{field.title || 'Mensagem'}</h2>
            {field.description && <p className="whitespace-pre-line" style={descStyle}>{field.description}</p>}
          </div>
        )}

        {/* Thanks */}
        {field.type === 'thanks' && (
          <div>
            <h2 className="text-2xl font-bold mb-2" style={titleStyle}>{field.title || 'Obrigado!'}</h2>
            {field.description && <p className="mb-4 whitespace-pre-line" style={descStyle}>{field.description}</p>}
            {settings.thanksType === 'redirect' && settings.buttonText && (
              <div style={elementsStyle}>
                <button
                  className="px-6 py-2 rounded-lg text-white font-medium"
                  style={buttonStyle}
                >
                  {settings.buttonText}
                </button>
              </div>
            )}
            {settings.thanksType === 'ticket' && (
              <div className="mt-4 flex flex-col items-center">
                {settings.ticketBackgroundUrl ? (
                  <div
                    className="relative w-40 overflow-hidden"
                    style={{
                      aspectRatio: '1080 / 1440',
                      border:
                        (settings.ticketImageBorderWidth || 0) > 0
                          ? `${settings.ticketImageBorderWidth}px solid ${settings.ticketImageBorderColor || '#e5e7eb'}`
                          : '1px solid #e5e7eb',
                      borderRadius: settings.ticketImageBorderRadius ?? 8,
                    }}
                  >
                    <img
                      src={settings.ticketBackgroundUrl}
                      alt="Arte do ingresso"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div
                      className="grid place-items-center bg-white/90 border border-gray-300 rounded"
                      style={ticketQrBoxStyle(settings)}
                    >
                      <QrCode className="w-2/3 h-2/3 text-gray-700" />
                      {settings.ticketFieldId && (
                        <span
                          className="whitespace-nowrap text-[7px] font-semibold leading-none"
                          style={ticketLabelStyle(settings)}
                        >
                          Texto
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div
                    className="w-40 grid place-items-center rounded-lg border border-dashed border-gray-300 text-gray-400 text-xs text-center px-2"
                    style={{ aspectRatio: '1080 / 1440' }}
                  >
                    Envie a arte 1080×1440
                  </div>
                )}
                <button
                  className="mt-3 px-6 py-2 rounded-lg text-white font-medium"
                  style={buttonStyle}
                >
                  {settings.ticketDownloadText || 'Baixar ingresso'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Next button for input fields */}
        {!['welcome', 'thanks', 'message'].includes(field.type) && (
          <div className="mt-6" style={elementsStyle}>
            <button
              className="px-6 py-2.5 rounded-lg text-white font-medium text-sm"
              style={buttonStyle}
            >
              Próximo →
            </button>
            <span className="text-xs text-gray-400 ml-3">ou pressione Enter ↵</span>
          </div>
        )}
      </div>
    </div>
  )
}
