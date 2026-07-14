interface ProgressBarProps {
  currentStep: number;
  total?: number;
}

export default function ProgressBar({
  currentStep,
  total = 3,
}: ProgressBarProps) {
  const pct = Math.round((currentStep / total) * 100);
  return (
    <div className="px-8 sm:px-10 lg:px-12 pt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#d4a843]/80">
          Step {currentStep} of {total}
        </span>
        <span className="text-[11px] uppercase tracking-[0.18em] text-[#faf6ee]/40 font-tabular">
          {pct}%
        </span>
      </div>
      <div className="h-px bg-white/[0.08] relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#e6c264] to-[#c89a36] transition-[width] duration-700 ease-spring"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}