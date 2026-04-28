import { SelectHTMLAttributes } from 'react'

interface Option {
  label: string
  value: string
}

interface AuthSelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Option[]
}

export default function AuthSelectField({ label, options, id, ...props }: AuthSelectFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <label htmlFor={fieldId} className="block space-y-2">
      <span className="text-sm font-medium text-white/90">{label}</span>
      <select
        id={fieldId}
        className="h-11 w-full rounded-md border border-violet-600 bg-violet-950 px-3 text-sm text-white outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-300/45"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900 text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}
