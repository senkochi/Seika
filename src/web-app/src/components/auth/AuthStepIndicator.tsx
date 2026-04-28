import { cn } from '../ui/utils'

interface AuthStepIndicatorProps {
  steps: string[]
  currentStep: number
}

export default function AuthStepIndicator({ steps, currentStep }: AuthStepIndicatorProps) {
  return (
    <div className="mb-6 grid grid-cols-3 gap-2">
      {steps.map((step, index) => {
        const isActive = index === currentStep
        const isDone = index < currentStep

        return (
          <div
            key={step}
            className={cn(
              'rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors',
              isDone && 'border-emerald-400 bg-emerald-500/30 text-emerald-100',
              isActive && 'border-amber-400 bg-gradient-to-r from-amber-400/35 to-yellow-500/35 text-amber-100',
              !isDone && !isActive && 'border-violet-600 bg-violet-900 text-violet-200',
            )}
          >
            {index + 1}. {step}
          </div>
        )
      })}
    </div>
  )
}
