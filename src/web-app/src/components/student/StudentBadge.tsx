import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../ui/utils";

type StudentBadgeVariant =
  | "glass"
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "gold";

type StudentBadgeProps = {
  children: ReactNode;
  variant?: StudentBadgeVariant;
  icon?: LucideIcon;
  uppercase?: boolean;
  className?: string;
};

// All variants now use the new dashboard palette tokens. No Tailwind
// amber/purple/green gradients — just hairline + tinted fill.
const variantClasses: Record<StudentBadgeVariant, string> = {
  glass: "bg-white/[0.04] text-cream border border-white/[0.08]",
  default: "bg-white/[0.025] text-cream border border-white/[0.06]",
  success: "bg-emerald-400/10 text-emerald-300 border border-emerald-400/25",
  warning: "bg-amber-400/10 text-amber-300 border border-amber-400/25",
  danger: "bg-red-400/10 text-red-300 border border-red-400/25",
  info: "bg-sky-400/10 text-sky-300 border border-sky-400/25",
  purple: "bg-white/[0.04] text-[#b8a9d9] border border-white/[0.08]",
  gold: "bg-[#d4a843]/10 text-[#d4a843] border border-[#d4a843]/25",
};

function StudentBadge({
  children,
  variant = "glass",
  icon: Icon,
  uppercase = true,
  className = "",
}: StudentBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-sans-ui",
        uppercase && "uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
    >
      {Icon ? <Icon className="w-3 h-3" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export default StudentBadge;