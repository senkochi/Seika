import { ReactNode } from 'react'

import { Card } from '../ui/card'

interface AuthLayoutProps {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 px-4 py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-amber-400/35 blur-3xl" />
        <div className="absolute right-0 top-20 h-72 w-72 rounded-full bg-violet-500/35 blur-3xl" />
        <div className="absolute -bottom-24 left-1/4 h-80 w-96 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute bottom-6 right-8 h-40 w-40 rounded-full bg-amber-300/30 blur-2xl" />
      </div>

      <Card className="relative z-10 w-full max-w-xl border-2 border-violet-600 bg-gradient-to-br from-purple-900 to-violet-900 p-8 text-white shadow-[0_20px_80px_rgba(76,29,149,0.55)]">
        {children}
      </Card>
    </main>
  )
}
