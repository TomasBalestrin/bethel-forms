// Monta o corpo enviado ao Hub a partir das respostas do form.
//
// Decisão de mapeamento (confirmada): as chaves de campos_extras são os TÍTULOS
// das perguntas (pra identificar fácil no Hub, ex. duas múltiplas escolhas
// distintas). Em cima disso, mapeamos canônicos detectáveis por tipo de campo
// (email/telefone/cpf/nome) pro Hub conseguir fundir/dedupe o lead.

export interface AnswerWithField {
  value: any
  field: { type: string; title: string | null } | null
}

export interface HubConfig {
  grupo_id: string | null
  etapa_id: string | null
}

export interface BuildOpts {
  event_id: string
  tipo: string
  occurred_at?: string | null
}

// Tipo de campo do form -> chave canônica do Hub.
const CANONICAL_BY_TYPE: Record<string, string> = {
  email: 'email',
  phone: 'telefone',
  cpf: 'cpf',
  full_name: 'nome',
}

// Converte o value (string ou objeto de opção) numa string simples p/ canônicos.
function toScalar(val: any): any {
  if (val === null || val === undefined) return val
  if (typeof val === 'object') {
    if (val.option && val.text) return `${val.option}: ${val.text}`
    if (val.option) return val.option
    return JSON.stringify(val)
  }
  return val
}

export function buildHubPayload(answers: AnswerWithField[], config: HubConfig, opts: BuildOpts): any {
  const campos_extras: Record<string, any> = {}
  const canonical: Record<string, any> = {}

  for (const a of answers) {
    const f = a.field
    if (!f) continue

    // Canônico: primeiro campo de cada tipo vence (só se tiver valor).
    const canonKey = CANONICAL_BY_TYPE[f.type]
    if (canonKey && canonical[canonKey] === undefined) {
      const scalar = toScalar(a.value)
      if (scalar !== null && scalar !== undefined && scalar !== '') canonical[canonKey] = scalar
    }

    // campos_extras keyed pelo título da pergunta (desambigua título repetido).
    const title = f.title
    if (title) {
      let key = title
      let n = 2
      while (key in campos_extras) key = `${title} (${n++})`
      campos_extras[key] = a.value
    }
  }

  const payload: any = {
    grupo_id: config.grupo_id,
    event_id: opts.event_id,
    evento: { tipo: opts.tipo, occurred_at: opts.occurred_at ?? null },
    ...canonical,
    campos_extras,
  }
  if (config.etapa_id) payload.etapa_id = config.etapa_id
  return payload
}

// Valor fictício por tipo de campo, pro envio de teste.
function fakeValue(type: string): any {
  switch (type) {
    case 'email':
      return 'teste@exemplo.com'
    case 'phone':
      return '(11) 99999-0000'
    case 'cpf':
      return '529.982.247-25' // CPF válido de teste
    case 'cnpj':
      return '11.222.333/0001-81'
    case 'full_name':
      return 'Lead de Teste'
    case 'short_text':
      return 'Resposta de teste'
    case 'long_text':
      return 'Resposta de teste mais longa para este campo.'
    case 'number':
      return 42
    case 'currency':
      return 1234.56
    case 'date':
      return '2000-01-15'
    case 'url':
      return 'https://exemplo.com'
    case 'identity_doc':
      return '12.345.678-9'
    case 'address':
      return 'Rua Exemplo, 123 - São Paulo/SP'
    case 'multiple_choice':
    case 'dropdown':
    case 'image_selection':
      return 'Opção de teste'
    case 'checkbox':
      return ['Opção A', 'Opção B']
    case 'satisfaction_scale':
      return 5
    case 'terms':
      return true
    default:
      return 'Teste'
  }
}

// Payload de teste: as MESMAS perguntas do form, com dados fictícios.
export function buildTestPayload(
  fields: { type: string; title?: string | null }[],
  config: HubConfig,
  eventId: string
): any {
  const answers: AnswerWithField[] = (fields || [])
    .filter((f) => f && !['welcome', 'thanks', 'message'].includes(f.type))
    .map((f) => ({ value: fakeValue(f.type), field: { type: f.type, title: f.title ?? null } }))

  return buildHubPayload(answers, config, { event_id: eventId, tipo: 'lead.test', occurred_at: null })
}
