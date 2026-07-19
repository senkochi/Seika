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
  glass: "bg-white/[0.06] text-cream",
  default: "bg-white/[0.04] text-cream",
  success: "bg-emerald-500/15 text-emerald-300",
  warning: "bg-amber-500/15 text-amber-300",
  danger: "bg-red-500/15 text-red-300",
  info: "bg-sky-500/15 text-sky-300",
  purple: "bg-purple-500/15 text-[#b8a9d9]",
  gold: "bg-[#d4a843]/15 text-[#d4a843]",
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
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium font-sans-ui",
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
