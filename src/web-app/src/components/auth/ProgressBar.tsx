interface ProgressBarProps {
  currentStep: number
  total?: number
}

export default function ProgressBar({ currentStep, total = 3 }: ProgressBarProps) {
  const pct = Math.round((currentStep / total) * 100)
  return (
    <div className="h-2 bg-purple-100">
      <div
        className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
