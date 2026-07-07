import { AlertTriangle, Loader2, X } from "lucide-react";

import type { UserAdminResponse } from "../../../api/types";

interface ResetPasswordModalProps {
  open: boolean;
  user: UserAdminResponse | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function ResetPasswordModal({
  open,
  user,
  onClose,
  onConfirm,
  isLoading,
}: ResetPasswordModalProps) {
  if (!open || !user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[var(--foreground)]">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            Reset mật khẩu
          </h3>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-4 text-sm text-[var(--muted-foreground)]">
          <p>
            Reset mật khẩu cho{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {user.username}
            </span>
            .
          </p>
          <p>
            Mật khẩu mới sẽ được random và{" "}
            <span className="font-bold text-rose-400">không khả dụng</span> trên
            hệ thống. User cần liên hệ admin qua kênh khác (email/điện thoại) để
            nhận lại mật khẩu.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[rgba(0,0,0,0.15)] p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận reset
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordModal;