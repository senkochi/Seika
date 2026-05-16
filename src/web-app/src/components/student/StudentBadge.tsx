import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

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

const variantClasses: Record<StudentBadgeVariant, string> = {
  glass:
    "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border)]",
  default:
    "bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)]",
  success: "bg-green-500/20 text-green-400 border border-green-500/40",
  warning: "bg-orange-500/20 text-orange-400 border border-orange-500/40",
  danger: "bg-red-500/20 text-red-400 border border-red-500/40",
  info: "bg-blue-500/20 text-blue-400 border border-blue-500/40",
  purple: "bg-purple-500/20 text-[var(--primary)] border border-purple-500/40",
  gold: "bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 border border-amber-300/60",
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
      className={[
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black",
        uppercase ? "uppercase tracking-wider" : "",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {Icon ? <Icon className="w-3 h-3" /> : null}
      {children}
    </span>
  );
}

export default StudentBadge;
