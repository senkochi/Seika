import type { ReactNode } from "react";
import { cn } from "./utils";
import { IconChip, type Variant } from "./IconChip";

type Props = {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: string; trend: "up" | "down" | "flat" };
  icon?: ReactNode;
  iconVariant?: Variant;
  hint?: string;
  className?: string;
};

const trendTone: Record<"up" | "down" | "flat", string> = {
  up: "text-emerald-300",
  down: "text-red-300",
  flat: "text-white/50",
};

/**
 * StatCard — single minimalist KPI card. Replaces the 4-up colorful
 * `from-amber to-yellow` / `from-violet to-indigo` gradient tiles.
 * Always Outfit. Numbers use tabular-nums.
 */
export function StatCard({
  label,
  value,
  unit,
  delta,
  icon,
  iconVariant = "muted",
  hint,
  className = "",
}: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] p-5",
        "bg-[var(--card)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.12em] text-white/45 font-sans-ui">
          {label}
        </p>
        {icon && <IconChip variant={iconVariant}>{icon}</IconChip>}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-sans-ui text-3xl font-semibold text-cream tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-white/45 font-sans-ui">{unit}</span>
        )}
      </div>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs font-sans-ui">
          {delta && (
            <span className={trendTone[delta.trend]}>{delta.value}</span>
          )}
          {hint && <span className="text-white/40">{hint}</span>}
        </div>
      )}
    </div>
  );
}
