import Link from 'next/link'
import {
  BarChart3,
  Zap,
  Shield,
  Palette,
  FileText,
  MousePointerClick,
} from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Respostas em Tempo Real',
    description: 'Acompanhe cada resposta no momento em que ela chega, sem precisar atualizar a página.',
  },
  {
    icon: BarChart3,
    title: 'Tudo em Um Lugar',
    description: 'Crie formulários, colete respostas e analise dados em uma única plataforma.',
  },
  {
    icon: MousePointerClick,
    title: 'Rastreamento Nativo',
    description: 'Meta Pixel, Google Analytics e GTM integrados sem precisar de código extra.',
  },
  {
    icon: Shield,
    title: 'Dados Seguros',
    description: 'Suas respostas protegidas com criptografia e controle de acesso por formulário.',
  },
  {
    icon: Palette,
    title: 'Visual Personalizado',
    description: 'Cores, fontes, logo e estilo totalmente customizáveis para sua marca.',
  },
  {
    icon: FileText,
    title: 'Simples de Usar',
    description: 'Interface intuitiva para criar formulários profissionais em minutos.',
  },
]

const highlights = [
  {
    title: 'Crie Formulários',
    description: 'Editor visual com campos de texto, múltipla escolha, escala NPS, telefone e mais.',
    visual: (
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">1</div>
          <div className="h-2 w-32 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">2</div>
          <div className="h-2 w-24 bg-gray-200 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-100 flex items-center justify-center text-[10px] text-blue-600 font-bold">3</div>
          <div className="h-2 w-28 bg-gray-200 rounded" />
        </div>
        <div className="mt-2 h-8 w-20 bg-blue-500 rounded-lg" />
      </div>
    ),
  },
  {
    title: 'Colete Respostas',
    description: 'Formulários publicados via link personalizado com captura de UTMs automática.',
    visual: (
      <div className="flex flex-col items-center gap-3 p-4">
        <div className="text-xs text-gray-400 font-mono">bethel.com/meu-form</div>
        <div className="flex gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">152</div>
            <div className="text-[10px] text-gray-400">Respostas</div>
          </div>
          <div className="w-px bg-gray-200" />
          <div>
            <div className="text-2xl font-bold text-green-600">87%</div>
            <div className="text-[10px] text-gray-400">Conclusão</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Analise Resultados',
    description: 'Dashboard com métricas, exportação CSV e visualização individual de cada resposta.',
    visual: (
      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-gray-400">Taxa de conclusão</div>
          <div className="text-xs font-bold text-blue-600">92%</div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-[92%] bg-blue-500 rounded-full" />
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-[10px] text-gray-400">Tempo médio</div>
          <div className="text-xs font-bold text-gray-700">2min 34s</div>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full w-[65%] bg-green-500 rounded-full" />
        </div>
      </div>
    ),
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Bethel<span className="text-blue-600">Forms</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-2.5 rounded-lg"
            >
              Criar conta gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-200 bg-white text-sm text-gray-600 mb-8">
            <span className="flex -space-x-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white" />
              <span className="w-5 h-5 rounded-full bg-green-500 border-2 border-white" />
              <span className="w-5 h-5 rounded-full bg-purple-500 border-2 border-white" />
            </span>
            Usado por empresas que crescem
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Transforme Visitantes<br />
            em Dados Valiosos
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10">
            Crie formularios profissionais com rastreamento nativo,
            personalizacao completa e analise de respostas em tempo real.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-base"
            >
              Comece Gratis
            </Link>
            <p className="text-sm text-gray-400">Sem cartao de credito</p>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/80 overflow-hidden">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-gray-100 rounded-md text-xs text-gray-400 font-mono">
                  app.bethelforms.com/dash
                </div>
              </div>
            </div>
            {/* Mock dashboard */}
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="text-lg font-bold text-gray-900">Bethel<span className="text-blue-600">Forms</span></div>
                <div className="h-8 w-20 bg-blue-500 rounded-lg" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Respostas</div>
                  <div className="text-2xl font-bold text-gray-900">1.247</div>
                  <div className="text-xs text-green-600 mt-1">+12% esta semana</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Formularios</div>
                  <div className="text-2xl font-bold text-gray-900">8</div>
                  <div className="text-xs text-gray-400 mt-1">3 publicados</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Conclusao</div>
                  <div className="text-2xl font-bold text-blue-600">89%</div>
                  <div className="text-xs text-gray-400 mt-1">media geral</div>
                </div>
              </div>
              <div className="space-y-3">
                {['Vaga - Executivo de Vendas', 'Pesquisa de Satisfacao', 'Cadastro de Leads'].map((name, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100">
                    <div className="w-16 h-12 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{name}</div>
                      <div className="text-xs text-gray-400">{[52, 128, 34][i]} respostas</div>
                    </div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${i < 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {i < 2 ? 'Publicado' : 'Rascunho'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 px-4 py-1 rounded-full mb-4">
              Funcionalidades
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Tudo Que Voce Precisa<br />
              em Uma Plataforma
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Crie, publique, rastreie e analise formularios de forma simples e rapida.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-lg hover:shadow-gray-100/50 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                    <Icon size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-medium text-blue-600 border border-blue-200 bg-blue-50 px-4 py-1 rounded-full mb-4">
              Como Funciona
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              De Formulario a Insight<br />
              em 3 Passos
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:shadow-gray-100/50 transition-all"
              >
                <div className="h-48 bg-gray-50 flex items-center justify-center border-b border-gray-100">
                  {item.visual}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Pronto para Comecar?
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            Crie sua conta gratis e lance seu primeiro formulario em minutos.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-base"
          >
            Criar Conta Gratis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200/50 bg-[#f0f4f8]">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <span>Bethel<span className="text-blue-600">Forms</span></span>
          <span>2024 Bethel Forms. Todos os direitos reservados.</span>
        </div>
      </footer>
    </div>
  )
}
