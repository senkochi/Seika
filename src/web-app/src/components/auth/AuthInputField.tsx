import { ComponentProps } from 'react'

import { Input } from '../ui/input'
import { cn } from '../ui/utils'

interface AuthInputFieldProps extends ComponentProps<'input'> {
  label: string
}

export default function AuthInputField({ label, className, id, ...props }: AuthInputFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <label htmlFor={fieldId} className="block space-y-2">
      <span className="text-sm font-medium text-white/90">{label}</span>
      <Input
        id={fieldId}
        className={cn(
          'h-11 border-violet-600 bg-violet-950 text-white placeholder:text-violet-300 focus-visible:border-amber-400 focus-visible:ring-amber-300/45',
          className,
        )}
        {...props}
      />
    </label>
  )
}
