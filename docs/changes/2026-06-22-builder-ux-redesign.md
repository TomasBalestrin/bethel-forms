> 🦅 Falcão | 2026-06-22 | v1.4.0

# Change: Redesign UX do builder de forms

## Objetivo
5 mudanças na experiência do editor de formulários, focadas em reduzir cliques,
dar controle de layout e separar Configurações (config do form) de Design (aparência).

## Escopo (5 itens do briefing)

### 1. Clique no campo abre propriedades (remover botão "Opções")
- **Hoje**: lista esquerda `onClick` só seleciona (edit/page.tsx:408). Propriedades
  abrem via botão "Opções" no header do preview (edit/page.tsx:480-491).
- **Mudança**:
  - Remover o botão "Opções" do header do preview.
  - Selecionar campo (clique na lista esquerda OU clique no preview central) já
    coloca o painel direito em modo `settings` automaticamente.
  - Manter Design acessível pelo header global (ver item 4), não mais condicionado
    à seleção.
- **Arquivos**: `edit/page.tsx` (header do preview, handler de seleção), `field-preview.tsx`
  (adicionar `onClick` no wrapper pra selecionar/abrir settings).

### 2. Painéis esquerdo e direito redimensionáveis
- **Hoje**: larguras fixas `w-72` (288px) e `w-80` (320px), sem resize (edit/page.tsx:364,525).
- **Mudança**: handles de arraste entre painel↔centro nos dois lados.
  - Largura controlada por estado (`leftWidth`, `rightWidth`) com min/max (ex.: 220–420px).
  - Persistir no `localStorage` por usuário (chave `builder:panelWidths`).
  - Drag handle de 4–6px com `cursor-col-resize`, feedback visual no hover.
- **Implementação**: componente leve `ResizeHandle` (mousedown → listeners move/up),
  sem dependência nova. Larguras aplicadas via `style={{ width }}` em vez de classe Tailwind fixa.
- **Arquivos**: `edit/page.tsx`, novo `components/form-builder/resize-handle.tsx`.

### 3. "Ver" → "Preview" + botão "Configurações" (tela cheia)
- **Hoje**: botão "Ver" abre `/{slug}` em nova aba (form-top-bar.tsx:108-115). Config
  do form vive na rota separada `/form/[formId]/settings` (tracking, SEO, notificações,
  webhooks, slug). Não há link pra ela no editor.
- **Mudança**:
  - Renomear label "Ver" → "Preview" (mantém ação de abrir form público).
  - Novo botão "Configurações" ao lado, abre **modal/overlay fullscreen** dentro do editor.
  - O fullscreen reúne as features de config que hoje estão espalhadas (settings page +
    bloco de tracking/webhook que está no AppearancePanel): Rastreamento (Pixel/GA/GTM/UTMs),
    SEO/Compartilhamento, Notificações, Webhooks, Slug/Link personalizado.
  - **Reuso**: extrair as seções da `settings/page.tsx` para componentes reutilizáveis e
    montá-las no overlay (evita duplicar a lógica de save). A rota `/settings` pode passar a
    redirecionar pro editor com o overlay aberto, ou ser mantida como fallback.
- **Arquivos**: `form-top-bar.tsx` (label + novo botão + nova prop `onOpenSettings`),
  `edit/page.tsx` (estado `showSettingsModal` + render do overlay), novo
  `components/form-builder/settings-modal.tsx`, extrair seções de `settings/page.tsx`.

### 4. Botão "Design" no header global → aba Aparência no painel direito
- **Hoje**: botão "Design" no header do preview, só aparece com campo selecionado
  (edit/page.tsx:492-503). AppearancePanel mistura aparência + tracking + webhook + slug
  (appearance-panel.tsx).
- **Mudança**:
  - Mover "Design" pro TopBar global, ao lado de "Configurações" (sempre visível).
  - Clicar coloca painel direito em modo `appearance`.
  - **Limpar o AppearancePanel**: tirar Rastreamento, Webhooks e Slug dele (vão pro
    fullscreen de Configurações, item 3). Deixar só aparência pura.
  - **Novas opções de aparência úteis** (a confirmar com o usuário): família de fonte,
    tamanho base de fonte, estilo/tamanho do botão (cor/raio), espaçamento entre campos,
    alinhamento global padrão (default herdado pelos campos do item 5), imagem de fundo,
    cor de fundo do card.
- **Arquivos**: `form-top-bar.tsx`, `edit/page.tsx` (header do preview, modo do painel),
  `appearance-panel.tsx` (remover blocos de config, adicionar opções novas),
  `types/index.ts` (estender `FormAppearance`).

### 5. Alinhamento por campo (Título / Descrição / Elementos: esq/centro/dir)
- **Hoje**: alinhamento hardcoded por tipo no `field-preview.tsx` (welcome/thanks/message =
  center; demais = left). Sem campo no type, sem UI.
- **Mudança**:
  - Adicionar ao `FormFieldData` (ou `FormFieldSettings`) um objeto:
    ```ts
    alignment?: {
      title?: 'left' | 'center' | 'right'
      description?: 'left' | 'center' | 'right'
      elements?: 'left' | 'center' | 'right'
    }
    ```
  - UI no `FieldSettingsPanel`: 3 grupos de 3 botões (toggle de alinhamento), renderizados
    **acima** do toggle "Evento de conversão" (`conversionEvent`), pra todos os campos exceto
    onde não faz sentido (a definir; default pra todos).
  - Alinhamento vive em **TRÊS** renderers separados (corrigido pós-Loki):
    1. `field-preview.tsx` (preview do editor) — title `text-center` :43, desc `text-left` :45.
    2. `src/app/(public)/[slug]/page.tsx` (render público REAL de title/description) —
       welcome h1 :340-341, desc :343; thanks :358-360; message :377-380; input :396,:402.
       **NÃO é `components/form-renderer/` — esse só renderiza o input, não title/desc.**
    3. `form-field-input.tsx` — pra alinhar "elements" (inputs são `w-full`; alinhar exige
       wrapper, não só `text-align`).
  - **Fallback POR-TIPO, não global**: forms sem `alignment` têm que replicar o hardcode
    atual (welcome/thanks/message = center, demais = left). Default global 'left' quebraria
    welcome/thanks que hoje são center.
- **Arquivos**: `types/index.ts`, `field-settings-panel.tsx`, `field-preview.tsx`,
  `src/app/(public)/[slug]/page.tsx`, `form-field-input.tsx`.

## Correções pós-Loki (CRÍTICAS — ler antes de codar)
- **Slug tem 2 convenções**: settings page usa `form.slug` (top-level); editor usa
  `settings._slug` (edit/page.tsx:237, appearance-panel:209). Reusar seção da settings no
  modal SEM unificar = slug some/diverge no publish. Decidir uma fonte única.
- **2 modelos de save incompatíveis**: settings page faz `updateSettings('tracking.pixelId', v)`
  (path-split aninhado); editor faz merge raso de 1 nível (edit/page.tsx:538-551). Seções
  extraídas precisam de um `onUpdate` que sirva nos dois → extrair como componentes "burros"
  (value+onChange), página continua dona do `saveSettings`.
- **Webhook persiste FORA do ciclo "Publicar"**: WebhooksSection salva via API própria, não
  espera o botão Publicar. Manter esse comportamento e deixar claro na UI.
- **Itens 1 e 4 são interdependentes** (mesmo sprint): auto-abrir settings ao selecionar
  campo SÓ deve trocar se o painel NÃO estiver já em `appearance` (senão tira o usuário do
  Design à força a cada clique de campo). `addField` (edit:168) auto-seleciona mas hoje NÃO
  troca painel — preservar.
- **Defaults de cor divergem** entre componentes: textColor `#111827` (preview/appearance)
  vs `#ffffff` (settings:168); background `#000921` (settings) vs `#ffffff` (editor). E vocab
  inconsistente: `answerColor` (settings) vs `descriptionColor`/`optionColor`/`placeholderColor`
  (panels). `FormAppearance` (types:101-112) NÃO tipa metade desses (entram via `[key]:any`).
  Item 4 deve PRIMEIRO reconciliar/tipar o que já existe solto, depois adicionar fonte/tamanho.
- **Item 2**: adicionar `min-w-0` no container central `flex-1` (edit:468), senão o centro não
  encolhe quando os dois painéis vão ao máximo. localStorage é por-navegador (não por-usuário).

## Pontos de atenção / risco
- **Persistência**: confirmar que `settings` (jsonb) aceita os novos campos sem migração de
  schema (campos opcionais em JSON → sem migration). Validar no save/load.
- **Compat retro**: forms antigos sem `alignment` devem renderizar igual a hoje (fallbacks).
- **Duplicação**: item 3 NÃO deve recriar lógica de config que já existe em `settings/page.tsx`
  — extrair e reusar.
- **`/ui-ux-pro-max`**: aplicar padrões de resize (min/max, persistência), toggles de
  alinhamento acessíveis (aria-pressed), e o modal fullscreen com foco/escape/scroll-lock.

## Ordem sugerida de implementação
1. Item 5 (type `alignment` + UI + preview + renderer) — base de dados, isolado.
2. Item 1 (clique abre settings, remover "Opções").
3. Item 4 (Design no header global + limpar AppearancePanel).
4. Item 3 (Preview rename + Configurações fullscreen, reusando settings).
5. Item 2 (resize dos painéis) — puramente visual, por último.

## Decisões (RESOLVIDAS pelo usuário 2026-06-22)
- D1 (item 4): adicionar SÓ Tipografia (família + tamanho base) e Botão (cor/raio/tamanho).
  NÃO adicionar espaçamento nem fundo do card agora.
- D2 (item 3): rota `/settings` passa a REDIRECIONAR pro editor com o overlay Configurações
  aberto (UI única, sem duplicação). Refactor das seções em componentes "burros" reusados
  pelo overlay; o save vive no editor/overlay.
- D3 (item 5): alinhamento vale pra TODOS os campos (inclusive welcome/thanks/message).
  Fallback por-tipo preserva o center atual desses 3 enquanto o usuário não tocar.
