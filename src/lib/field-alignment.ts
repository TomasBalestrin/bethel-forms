import type { FieldAlign, FieldAlignment } from '@/types'

// Defaults POR TIPO — replicam o hardcode visual atual dos renderers,
// pra forms sem `alignment` renderizarem identicos ao que era antes.
// welcome: titulo centro, descricao esquerda (comportamento legado), elementos centro.
// thanks/message: tudo centro.
// satisfaction_scale: elementos centro (escala sempre foi justify-center).
// demais inputs: esquerda.
const TYPE_DEFAULTS: Record<string, Required<FieldAlignment>> = {
  welcome: { title: 'center', description: 'left', elements: 'center' },
  thanks: { title: 'center', description: 'center', elements: 'center' },
  message: { title: 'center', description: 'center', elements: 'center' },
}

const INPUT_DEFAULT: Required<FieldAlignment> = {
  title: 'left',
  description: 'left',
  elements: 'left',
}

export function getFieldAlignment(field: any): Required<FieldAlignment> {
  const type: string = field?.type
  const base = TYPE_DEFAULTS[type] || INPUT_DEFAULT
  const elementsDefault = type === 'satisfaction_scale' ? 'center' : base.elements
  const a: FieldAlignment = field?.settings?.alignment || {}
  return {
    title: a.title || base.title,
    description: a.description || base.description,
    elements: a.elements || elementsDefault,
  }
}

export const alignToText: Record<FieldAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

export const alignToJustify: Record<FieldAlign, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

export const alignToItems: Record<FieldAlign, string> = {
  left: 'items-start',
  center: 'items-center',
  right: 'items-end',
}
