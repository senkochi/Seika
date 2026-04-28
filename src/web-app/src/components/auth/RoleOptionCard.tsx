import { ReactNode } from 'react'

import { cn } from '../ui/utils'

interface RoleOptionCardProps {
  label: string
  selected: boolean
  icon: ReactNode
  onSelect: () => void
}

export default function RoleOptionCard({ label, selected, icon, onSelect }: RoleOptionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border p-4 text-white transition-all',
        selected
          ? 'border-amber-400 bg-gradient-to-br from-amber-400/35 to-yellow-500/35 shadow-lg shadow-amber-300/25'
          : 'border-violet-600 bg-violet-950 hover:border-violet-400 hover:bg-violet-900',
      )}
    >
      <span className="rounded-full bg-violet-700 p-3 transition group-hover:bg-violet-600">{icon}</span>
      <span className="text-sm font-semibold tracking-wide">{label}</span>
    </button>
  )
}
