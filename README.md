# FormFlow - Formulários Inteligentes

SaaS brasileiro de criação de formulários online com foco em captura, gestão e automação de leads para profissionais de marketing digital.

## Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Next.js API Routes
- **Banco de Dados**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Autenticação**: NextAuth.js
- **Storage**: Supabase Storage

## Começando

### Pré-requisitos

- Node.js 18+
- PostgreSQL (ou conta Supabase)

### Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas credenciais

# Gerar Prisma Client
npx prisma generate

# Aplicar schema no banco
npx prisma db push

# Iniciar em desenvolvimento
npm run dev
```

### Variáveis de Ambiente

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DATABASE_URL=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/          # Páginas de autenticação
│   ├── (dashboard)/     # Dashboard e editor
│   ├── (public)/        # Formulário público
│   └── api/             # API Routes
├── components/
│   ├── ui/              # Componentes base (Button, Input, etc.)
│   ├── form-builder/    # Componentes do editor
│   ├── form-renderer/   # Componentes do formulário público
│   ├── dashboard/       # Componentes do dashboard
│   └── responses/       # Componentes de visualização
├── lib/                 # Utilitários e configurações
├── hooks/               # React hooks customizados
└── types/               # TypeScript types
```

## Funcionalidades (MVP)

- Autenticação (email + Google OAuth)
- Dashboard com lista de formulários
- Form Builder com 8 tipos de campo essenciais
- Customização de cores, logo e slug
- Formulário público (uma pergunta por vez, responsivo)
- Salvamento automático de respostas parciais
- Visualização de respostas (tabela + individual)
- Exportação CSV
- Meta Pixel + Google Analytics
- Rastreamento de UTMs
