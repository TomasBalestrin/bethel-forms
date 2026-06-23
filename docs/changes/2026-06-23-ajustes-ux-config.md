> 🦅 Falcão + 👑 Odin | 2026-06-23 | v1.4.0

# Ajustes na nova UX do builder — Configurações

## Contexto

Branch `feat/builder-ux-redesign`. Quatro ajustes pedidos sobre a aba/overlay de
Configurações e verificação das novas features. Mapa do Falcão (read-only)
abaixo, depois o plano por item.

## Mapa do builder (file:line)

| Peça | file:line |
|---|---|
| Página editor (container, estado, publish) | `src/app/(dashboard)/form/[formId]/edit/page.tsx` |
| TopBar global (Design/Config/Preview/Compartilhar/Publicar) | `src/components/dashboard/form-top-bar.tsx` |
| Overlay Configurações (fullscreen z-50) | `src/components/form-builder/settings-modal.tsx` |
| Painel Aparência | `src/components/form-builder/appearance-panel.tsx` |
| PUT form (grava settings jsonb) | `src/app/api/forms/[id]/route.ts:67-119` |
| Types FormSettings | `src/types/index.ts` |
| Default na criação | `src/app/api/forms/route.ts` |
| Render público | `src/app/(public)/[slug]/page.tsx` |

Estado: `showSettingsModal` (edit/page.tsx:53), `rightPanel` (:52). Persistência
via `live` ref + `mergeSettings` deep-merge → PUT no Publicar.

---

## Item 1 — Manter header do editor na tela de Configurações

**Decisão do usuário:** manter o TopBar global (Design/Config/Preview/Publicar)
visível dentro de Configurações, pra navegar sem fechar. Configurações deixa de
ser overlay e vira uma **tela/painel renderizado ABAIXO do TopBar**.

Hoje: `onOpenSettings` seta `showSettingsModal=true` → `SettingsModal` renderiza
`fixed inset-0 z-50` (settings-modal.tsx:62), cobrindo o TopBar (z-30).

Mudança (refinada pós-Loki — NÃO é só trocar CSS, mexe no render):
- **Manter `showSettingsModal` (bool)** como o estado de "tela Config". NÃO
  fundir com `rightPanel:'settings'` — esse já existe e significa outra coisa
  (painel de props do campo, FieldSettingsPanel). Evita colisão semântica.
- `edit/page.tsx`: TopBar montado no topo SEMPRE. Abaixo dele, render
  condicional: `{showSettingsModal ? <Settings/> : <div className="flex flex-1">…editor…</div>}`.
  Esconder o bloco dos 3 painéis quando Config ativa (senão empilha/scroll
  infinito). Estado dos painéis fica em `useState` (não desmonta) → largura
  preservada ao voltar.
- `settings-modal.tsx`: trocar wrapper `fixed inset-0 z-50` por container de
  fluxo (`flex-1 overflow-y-auto` abaixo do TopBar). Remover o
  `document.body.style.overflow='hidden'` (:40-53, não é mais overlay). Header
  próprio do modal (:64-73) vira título de seção; X some — navegar via TopBar
  (clicar Design volta ao editor). Escape pode continuar fechando (setar
  `showSettingsModal=false`).
- Deep-link `?config=1` (page.tsx:129-133 + settings/page.tsx redirect):
  continua setando `showSettingsModal=true`. Como o bool é mantido, NÃO quebra.
- TopBar (`form-top-bar.tsx`): botão Configurações marca estado ativo;
  Publicar/Design/Preview já clicáveis (deixam de ficar cobertos).
- **Preservar** os componentes `Section` e `Toggle` (settings-modal.tsx:29) —
  Rastreamento/UTM ainda usam. Webhooks (`WebhooksSection`) continua dentro da
  tela, salvando via API própria.

Arquivos: `settings-modal.tsx`, `edit/page.tsx`, `form-top-bar.tsx`. Sem
mudança de schema/persistência.

## Item 2 — Persistência das Configurações ao Publicar

**Verificado: tudo salva. Nenhuma ação de código.**

Publicar (`edit/page.tsx:272-390`) monta `{ name, slug, settings }` e faz PUT →
grava `settings` jsonb inteiro. Campos do modal (slug, tracking pixel/GA/GTM/UTM,
seo, notifications) entram todos em `form.settings` via `mergeSettings` e são
persistidos. Webhooks salvam fora do ciclo Publicar (via API própria,
intencional e documentado).

Observação (fora de escopo, só registro): slug usa dupla convenção
(`settings._slug` vs `form.slug` top-level) — funciona, mas é frágil. Não mexer
agora.

## Item 3 — Novas features funcionando

**Verificado: todas funcionais, zero TODO/stub.**

| Feature | Status |
|---|---|
| Clique no campo abre props (sem botão "Opções") | OK |
| Painéis redimensionáveis + persist localStorage | OK |
| "Ver"→"Preview" + Configurações | OK |
| Design no header → aba Aparência (Tipografia+Botão) | OK |
| Alinhamento por campo (wired nos 3 renderers) | OK |
| Rota /settings → redirect | OK |
| Webhooks (change anterior) | OK |

Nenhuma ação. (Item 1 reorganiza como Configurações é exibida, sem quebrar isso.)

## Item 4 — Remover "SEO e Compartilhamento" e "Notificações"

Ambas são settings **mortas**: escritas mas nunca lidas no render público, e
Notificações **nunca teve dispatch de email**. Remoção segura. Tirar nos dois
lados (UI + type + default) juntos pra não quebrar o TS.

**SEO e Compartilhamento:**
- Render da seção: `settings-modal.tsx:134-152`
- State local: `settings-modal.tsx:58`
- Type: `src/types/index.ts:126-130` (`seo`)
- Default criação: `src/app/api/forms/route.ts:53`
- Exposição órfã: `src/app/api/public/forms/[slug]/route.ts:63` (remover linha)

**Notificações:**
- Render da seção: `settings-modal.tsx:154-164`
- State local: `settings-modal.tsx:59`
- Type: `src/types/index.ts:137-142` (`notifications`)
- Default criação: `src/app/api/forms/route.ts:55`

Forms antigos com `seo`/`notifications` no jsonb: lixo inofensivo, sem migration.

---

## Escopo de arquivos (resumo)

| Arquivo | Itens | Ação |
|---|---|---|
| `settings-modal.tsx` | 1, 4 | converter overlay→tela; remover 2 seções |
| `edit/page.tsx` | 1 | Configurações como modo de tela, TopBar fixo |
| `form-top-bar.tsx` | 1 | estado ativo do botão Configurações |
| `types/index.ts` | 4 | remover `seo`, `notifications` |
| `api/forms/route.ts` | 4 | remover defaults `seo`/`notifications` |
| `api/public/forms/[slug]/route.ts` | 4 | remover exposição órfã de `seo` |

Itens 2 e 3: verificação só, sem edição.

## Riscos

1. Item 1 — converter overlay em tela mexe no layout; testar que Aparência,
   Preview e Publicar continuam acessíveis e que fechar Configurações volta ao
   editor com estado preservado.
2. Item 4 — remover do type sem remover dos defaults quebra o TS. Fazer juntos.
3. Slug dupla-convenção (dívida ativa): não introduzir divergência ao mexer no
   modal.

## Critério de aceite

- Configurações abre mantendo o TopBar visível; Design/Preview/Publicar
  navegáveis sem fechar. Editor some quando Config ativa (sem empilhar).
- Voltar pra Design preserva largura dos painéis e estado.
- Deep-link `/form/[id]/settings` redireciona e abre a nova tela de Config.
- Webhooks continua acessível e salvando dentro da nova tela.
- SEO e Notificações somem da UI; `Section`/`Toggle` preservados (Rastreamento).
- Tracking/slug/aparência continuam salvando no Publicar.
- `npm run build` sem erro.
