import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Form<span className="text-blue-600">Flow</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Crie formulários profissionais com Meta Pixel nativo, slug personalizado
          e visualização de respostas em tempo real.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Criar conta grátis
          </Link>
        </div>
      </div>
    </div>
  )
}
