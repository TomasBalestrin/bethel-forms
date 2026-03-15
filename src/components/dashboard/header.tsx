'use client'

import { useSession } from 'next-auth/react'

export function Header({ title }: { title: string }) {
  const { data: session } = useSession()

  return (
    <header className="flex items-center justify-between mb-8">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name || 'Usuário'}
          </p>
          <p className="text-xs text-gray-500">{session?.user?.email}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
          {(session?.user?.name || 'U').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
