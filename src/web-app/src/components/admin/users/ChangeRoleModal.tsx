import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

import type { UserAdminResponse } from "../../../api/types";
import ConfirmModal from "../../ui/ConfirmModal";
import { StatusPill } from "../../ui/StatusPill";

interface ChangeRoleModalProps {
  open: boolean;
  user: UserAdminResponse | null;
  onClose: () => void;
  onConfirm: (role: "STUDENT" | "TEACHER") => void;
  isLoading: boolean;
}

function roleVariant(role: string) {
  const upper = role.toUpperCase();
  if (upper === "ADMIN") return "danger" as const;
  if (upper === "TEACHER") return "gold" as const;
  return "info" as const;
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

  return (
    <ConfirmModal
      open={open && user !== null}
      onClose={onClose}
      onConfirm={() => onConfirm(role)}
      title="Đổi role"
      confirmText="Xác nhận"
      isLoading={isLoading}
      variant="primary"
      icon={<RefreshCw className="h-5 w-5" aria-hidden="true" />}
    >
      {user && (
        <div className="space-y-4 font-sans-ui">
          <p className="text-sm text-white/55">
            Đổi role cho{" "}
            <span className="font-semibold text-cream">{user.username}</span>.
            Hiện tại:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {user.roles.map((r) => (
              <StatusPill key={r} variant={roleVariant(r)}>
                {r}
              </StatusPill>
            ))}
          </div>
          <div className="space-y-2">
            <label
              htmlFor="change-role-select"
              className="block font-sans-ui text-xs uppercase tracking-[0.12em] text-white/55"
            >
              Role mới
            </label>
            <select
              id="change-role-select"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "STUDENT" | "TEACHER")
              }
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 font-sans-ui text-sm text-cream focus:border-[#d4a843]/50 focus:outline-none transition-colors"
            >
              <option value="STUDENT" className="bg-[#1c0f2e] text-cream">
                STUDENT
              </option>
              <option value="TEACHER" className="bg-[#1c0f2e] text-cream">
                TEACHER
              </option>
            </select>
          </div>
        </div>
      )}
    </ConfirmModal>
  );
}

export default ChangeRoleModal;