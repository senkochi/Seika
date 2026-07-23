import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ConfirmDialogProps {
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

function ConfirmDialog({
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  const { t } = useTranslation("teacher");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--card)] backdrop-blur-xl border border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start gap-4 mb-5">
          <div className="p-2 bg-red-500/10 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              {title}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] disabled:opacity-50"
          >
            {t("content.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-500 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("content.confirmDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
