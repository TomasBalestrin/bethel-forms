import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bethel Forms - Formulários Inteligentes',
  description: 'Crie formulários profissionais com rastreamento nativo, personalização completa e análise de respostas em tempo real.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  )
}
