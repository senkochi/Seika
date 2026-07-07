import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import type { UserAdminResponse } from "../../../api/types";
import RoleBadge from "./RoleBadge";

interface ChangeRoleModalProps {
  open: boolean;
  user: UserAdminResponse | null;
  onClose: () => void;
  onConfirm: (role: "STUDENT" | "TEACHER") => void;
  isLoading: boolean;
}

function ChangeRoleModal({
  open,
  user,
  onClose,
  onConfirm,
  isLoading,
}: ChangeRoleModalProps) {
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");

  useEffect(() => {
    if (open && user) {
      const nonAdminRole = user.roles.find((r) => r.toUpperCase() !== "ADMIN");
      setRole(
        nonAdminRole?.toUpperCase() === "TEACHER" ? "TEACHER" : "STUDENT",
      );
    }
  }, [open, user]);

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">
            Đổi role
          </h3>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm text-[var(--muted-foreground)]">
            Đổi role cho{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {user.username}
            </span>
            . Hiện tại:{" "}
            {user.roles.map((r) => (
              <RoleBadge key={r} role={r} />
            ))}
          </p>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "STUDENT" | "TEACHER")}
            className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          >
            <option value="STUDENT">STUDENT</option>
            <option value="TEACHER">TEACHER</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] bg-[rgba(0,0,0,0.15)] p-4">
          <button
            onClick={onClose}
            className="rounded-xl border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(role)}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChangeRoleModal;