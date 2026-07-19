import type { ReactNode } from "react";
import { cn } from "./utils";

type Variant = "success" | "danger" | "warning" | "info" | "neutral" | "gold";

const tone: Record<Variant, string> = {
  success: "bg-emerald-500/15 text-emerald-300",
  danger: "bg-red-500/15 text-red-300",
  warning: "bg-amber-500/15 text-amber-300",
  info: "bg-sky-500/15 text-sky-300",
  neutral: "bg-white/[0.06] text-white/75",
  gold: "bg-[#d4a843]/15 text-[#d4a843]",
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
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium font-sans-ui",
        tone[variant],
        className,
      )}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
    </span>
  );
}
