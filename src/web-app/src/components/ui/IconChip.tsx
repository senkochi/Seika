import type { ReactNode } from "react";
import { cn } from "./utils";

export type Variant =
  | "gold"
  | "muted"
  | "info"
  | "success"
  | "danger"
  | "warning";

const tone: Record<Variant, { bg: string; fg: string; border: string }> = {
  gold: {
    bg: "bg-[#d4a843]/15",
    fg: "text-[#d4a843]",
    border: "border-transparent",
  },
  muted: {
    bg: "bg-white/[0.06]",
    fg: "text-white/75",
    border: "border-transparent",
  },
  info: {
    bg: "bg-sky-500/15",
    fg: "text-sky-300",
    border: "border-transparent",
  },
  success: {
    bg: "bg-emerald-500/15",
    fg: "text-emerald-300",
    border: "border-transparent",
  },
  danger: {
    bg: "bg-red-500/15",
    fg: "text-red-300",
    border: "border-transparent",
  },
  warning: {
    bg: "bg-amber-500/15",
    fg: "text-amber-300",
    border: "border-transparent",
  },
};

type Props = {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  ariaLabel?: string;
  decorative?: boolean;
};

/**
 * IconChip — 9×9 hairline square that holds an icon. Decorative by default
 * (sets `aria-hidden`). Pass `decorative={false}` + `ariaLabel` when the
 * chip carries meaning on its own.
 */
export function IconChip({
  children,
  variant = "muted",
  className = "",
  ariaLabel,
  decorative = true,
}: Props) {
  const t = tone[variant];
  const a11y = decorative
    ? ({ "aria-hidden": true } as const)
    : ({ role: "img", "aria-label": ariaLabel } as const);

  return (
    <span
      {...a11y}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg border",
        t.bg,
        t.border,
        t.fg,
        className,
      )}
    >
      {children}
    </span>
  );
}
