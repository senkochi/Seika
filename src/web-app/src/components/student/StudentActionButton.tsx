import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type StudentActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  icon?: LucideIcon;
  size?: "md" | "lg";
  fullWidth?: boolean;
};

function StudentActionButton({
  children,
  icon: Icon,
  size = "md",
  fullWidth = true,
  className = "",
  ...props
}: StudentActionButtonProps) {
  const sizeClasses =
    size === "lg"
      ? "px-6 py-4 text-lg rounded-xl"
      : "px-4 py-3 text-base rounded-xl";

  const widthClasses = fullWidth ? "w-full" : "";

  const baseClasses =
    "bg-gradient-to-br from-amber-300 to-yellow-500 text-purple-950 font-black shadow-md " +
    "hover:from-yellow-400 hover:to-yellow-500 hover:-translate-y-0.5 " +
    "active:bg-gradient-to-r active:from-yellow-400 active:via-amber-300 active:to-yellow-400 " +
    "transition-all duration-300 flex items-center justify-center gap-2";

  return (
    <button
      className={[widthClasses, sizeClasses, baseClasses, className].join(" ")}
      {...props}
    >
      {Icon ? <Icon className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} /> : null}
      {children}
    </button>
  );
}

export default StudentActionButton;
