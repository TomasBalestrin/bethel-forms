// Assinatura estável do schema de perguntas do form. A MESMA função roda no
// client (alerta "precisa testar") e no server (gate de envio + armar no teste),
// por isso usa hash puro (sem node:crypto) e só campos presentes nos dois lados
// ({id, type, title}). Campos que não são pergunta (welcome/thanks/message) ficam
// de fora. Reordenar não muda a assinatura (o payload é keyed por título).

const NON_QUESTION_TYPES = new Set(['welcome', 'thanks', 'message'])

export interface SignatureField {
  id: string
  type: string
  title?: string | null
}

export function computeFieldsSignature(fields: SignatureField[]): string {
  const parts = (fields || [])
    .filter((f) => f && !NON_QUESTION_TYPES.has(f.type))
    .map((f) => `${f.id}:${f.type}:${f.title ?? ''}`)
    .sort()
    .join('|')

  // FNV-1a 32-bit (determinístico, sem dependências).
  let h = 0x811c9dc5
  for (let i = 0; i < parts.length; i++) {
    h ^= parts.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
