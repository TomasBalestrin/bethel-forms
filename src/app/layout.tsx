import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FormFlow - Formulários Inteligentes',
  description: 'Crie formulários profissionais com Meta Pixel nativo, slug personalizado e visualização de respostas em tempo real.',
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
