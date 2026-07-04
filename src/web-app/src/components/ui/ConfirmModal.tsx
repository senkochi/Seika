import React, { useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";

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

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  isLoading = false,
  variant = "primary",
  icon,
}: ConfirmModalProps) {
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

  const getVariantStyles = () => {
    switch (variant) {
      case "warning":
        return "bg-gradient-to-r from-amber-500 to-yellow-500 text-purple-950 font-black shadow-amber-500/20";
      case "danger":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-red-500/20";
      default:
        return "bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black shadow-amber-500/20";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5 bg-[var(--second-card)]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              {icon || <AlertCircle className="w-5 h-5 text-amber-400" />}
            </div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl p-2 text-[var(--muted-foreground)] hover:bg-[rgba(255,255,255,0.08)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-[var(--foreground)] space-y-4">{children}</div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--border)] bg-[var(--second-card)]/30 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--muted-foreground)] hover:bg-[rgba(255,255,255,0.06)] hover:text-[var(--foreground)] transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${getVariantStyles()}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
