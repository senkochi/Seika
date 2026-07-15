import type { ReactNode } from "react";
import { cn } from "./utils";

type Variant = "success" | "danger" | "warning" | "info" | "neutral" | "gold";

const tone: Record<Variant, string> = {
  success: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
  danger: "bg-red-400/10 text-red-300 border-red-400/25",
  warning: "bg-amber-400/10 text-amber-300 border-amber-400/25",
  info: "bg-sky-400/10 text-sky-300 border-sky-400/25",
  neutral: "bg-white/[0.04] text-white/70 border-white/[0.08]",
  gold: "bg-[#d4a843]/10 text-[#d4a843] border-[#d4a843]/25",
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  icon?: ReactNode;
  className?: string;
};

/**
 * StatusPill — always renders text content (no color-only information).
 * If used purely decoratively, wrap with `aria-hidden` at the call site.
 */
export function StatusPill({
  children,
  variant = "neutral",
  icon,
  className = "",
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-sans-ui",
        tone[variant],
        className,
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}