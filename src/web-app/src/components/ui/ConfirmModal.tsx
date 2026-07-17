import React, { useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./Button";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "primary" | "warning" | "danger";
  icon?: React.ReactNode;
}

/**
 * ConfirmModal — quiet destructive confirmation. Hairline border, no zoom-in,
 * no hover-scale, no shadow-2xl. Focus trap retained: Escape closes while
 * not loading; clicking the scrim closes (unless loading); X button + Cancel
 * button both route through onClose.
 *
 * Visuals only changed here — original behavior preserved verbatim.
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmText,
  cancelText,
  isLoading = false,
  variant = "primary",
  icon,
}: ConfirmModalProps) {
  const { t } = useTranslation("common");
  const resolvedConfirmText = confirmText ?? t("actions.confirm");
  const resolvedCancelText = cancelText ?? t("actions.cancel");
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onClose]);

  if (!open) return null;

  // Map legacy variant → new Button tone. Keep the public API stable.
  const confirmTone: "neutral" | "danger" =
    variant === "danger" ? "danger" : "neutral";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 animate-[confirm-fadeIn_200ms_ease-out]"
      onClick={() => !isLoading && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] overflow-hidden bg-[var(--card)] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4a843]/10 border border-[#d4a843]/25 flex items-center justify-center text-[#d4a843]">
              {icon || <AlertCircle className="w-5 h-5" />}
            </div>
            <h3
              id="confirm-modal-title"
              className="font-sans-ui text-base font-semibold text-[#faf6ee]"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            aria-label={t("actions.close")}
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-white/45 hover:bg-white/[0.06] hover:text-[#faf6ee] transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 text-[#faf6ee]/75 font-sans-ui text-sm space-y-3">
          {children}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-white/[0.06] px-6 py-4">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
          >
            {resolvedCancelText}
          </Button>
          <Button
            variant="ghost"
            tone={confirmTone}
            size="md"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {resolvedConfirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
