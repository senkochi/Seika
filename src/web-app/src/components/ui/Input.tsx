import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "./utils";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailing?: ReactNode;
  onClearError?: () => void;
}

/**
 * Double-bezel text input — outer hairline shell + inner core with
 * soft gold focus ring. Used in Login/Register forms.
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      hint,
      error,
      leadingIcon,
      trailing,
      className,
      id,
      onChange,
      onClearError,
      ...props
    },
    ref,
  ) => {
    const inputId = id ?? props.name ?? `input-${Math.random().toString(36).slice(2, 8)}`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block mb-2 text-[11px] uppercase tracking-[0.18em] font-medium text-[#d4a843]/80"
          >
            {label}
          </label>
        )}

        <div
          className={cn(
            "rounded-2xl p-px bg-white/[0.06] transition-colors duration-300 ease-soft",
            "focus-within:bg-gradient-to-b focus-within:from-[#d4a843] focus-within:to-[#a37f2a]",
            error && "bg-gradient-to-b from-[#ef4444] to-[#b91c1c]",
          )}
        >
          <div
            className={cn(
              "rounded-[calc(1rem-1px)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]",
              "flex items-center bg-[var(--color-card-surface)]",
            )}
          >
            {leadingIcon && (
              <span className="pl-4 text-[#b8a9d9] flex items-center">
                {leadingIcon}
              </span>
            )}
            <input
              ref={ref}
              id={inputId}
              onChange={(e) => {
                onChange?.(e);
                if (error && onClearError) onClearError();
              }}
              className={cn(
                "flex-1 bg-transparent text-[#faf6ee] placeholder:text-[#b8a9d9]/50",
                "h-12 px-4 text-base font-medium",
                "focus:outline-none",
                leadingIcon && "pl-3",
                trailing && "pr-2",
                className,
              )}
              {...props}
            />
            {trailing && (
              <span className="pr-2 text-[#b8a9d9] flex items-center">
                {trailing}
              </span>
            )}
          </div>
        </div>

        {error ? (
          <p className="mt-2 text-xs text-[#fca5a5] font-medium">{error}</p>
        ) : hint ? (
          <p className="mt-2 text-xs text-[#b8a9d9]/70">{hint}</p>
        ) : null}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";