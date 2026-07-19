import { ArrowUpRight } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils";

type Variant = "primary" | "ghost" | "link" | "dark";
type Size = "md" | "lg";
type Tone = "neutral" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  trailing?: boolean;
  loading?: boolean;
  children: ReactNode;
}

/**
 * Magnetic-style pill button. Primary uses a soft gold gradient with an
 * inset highlight (double-bezel feel) and a nested trailing icon circle.
 *
 * `tone="danger"` shifts a ghost button to red text + red hover tint
 * (use for destructive actions like Delete / Reset password). Other
 * variants ignore `tone` to keep the API surface small.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      tone = "neutral",
      trailing = false,
      loading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const base =
      "group relative inline-flex items-center justify-center gap-2 font-medium rounded-xl magnetic-press select-none disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none";

    const sizes: Record<Size, string> = {
      md: "h-11 px-5 text-sm",
      lg: "h-14 px-7 text-base",
    };

    const variants: Record<Variant, string> = {
      primary:
        "bg-gradient-to-b from-[#e6c264] to-[#c89a36] text-[#1c0f2e] shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_1px_2px_rgba(0,0,0,0.25)] hover:shadow-[inset_0_1px_1px_rgba(255,255,255,0.55),0_8px_24px_-8px_rgba(212,168,67,0.45)]",
      ghost:
        "bg-white/[0.04] text-[#faf6ee] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.16]",
      dark: "bg-[#1c0f2e] text-[#faf6ee] border border-[#1c0f2e] hover:bg-[#2a1247]",
      link: "text-[#d4a843] hover:text-[#f1e4c0] px-0 h-auto",
    };

    const dangerGhost =
      tone === "danger" && variant === "ghost"
        ? "!text-red-300 hover:!bg-red-500/10 hover:!border-red-500/30"
        : "";

    const isLink = variant === "link";

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          base,
          isLink ? "gap-1.5" : sizes[size],
          variants[variant],
          dangerGhost,
          className,
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Spinner />
            <span className="inline-flex items-center justify-center gap-2 shrink-0">
              {children}
            </span>
          </span>
        ) : (
          <>
            <span className="inline-flex items-center justify-center gap-2 shrink-0">
              {children}
            </span>
            {trailing && !isLink && (
              <span
                aria-hidden
                className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#1c0f2e]/15 group-hover:bg-[#1c0f2e]/25 group-hover:translate-x-[2px] group-hover:-translate-y-[1px] transition-transform duration-300 ease-spring"
              >
                <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
            )}
            {trailing && isLink && (
              <ArrowUpRight
                className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300 ease-spring"
                strokeWidth={2}
              />
            )}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-current border-r-transparent animate-spin"
    />
  );
}
