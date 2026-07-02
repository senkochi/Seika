import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Lock,
  Unlock,
  RefreshCw,
  X,
  Loader2,
  AlertTriangle,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  fetchAdminUsers,
  lockAdminUser,
  unlockAdminUser,
  changeAdminUserRole,
  resetAdminUserPassword,
  setUsersRoleFilter,
} from "../../store/adminSlice";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import type { UserAdminResponse } from "../../api/types";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {});

function roleBadge(role: string) {
  const upper = role.toUpperCase();
  if (upper === "ADMIN")
    return (
      <span className="inline-flex rounded-full bg-red-500/20 px-2 py-1 text-xs font-medium text-red-300">
        {role}
      </span>
    );
  if (upper === "TEACHER")
    return (
      <span className="inline-flex rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">
        {role}
      </span>
    );
  return (
    <span className="inline-flex rounded-full bg-blue-500/20 px-2 py-1 text-xs font-medium text-blue-300">
      {role}
    </span>
  );
}

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
            . Hiện tại: {user.roles.map((r) => roleBadge(r))}
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

function AdminUsers() {
  const dispatch = useAppDispatch();
  const { users, mutationStatus, mutationError } = useAppSelector(
    (state) => state.admin,
  );

  const [modalRole, setModalRole] = useState<UserAdminResponse | null>(null);
  const [modalReset, setModalReset] = useState<UserAdminResponse | null>(null);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setUsersRoleFilter(e.target.value));
  };

  useEffect(() => {
    void dispatch(fetchAdminUsers({ role: users.filterRole || undefined }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users.filterRole]);

  const handleLockToggle = async (user: UserAdminResponse) => {
    const action = user.enabled ? lockAdminUser : unlockAdminUser;
    const result = await dispatch(action(user.id));
    if (action.rejected.match(result)) {
      showError((result.payload as string) ?? "Thao tác thất bại");
    } else {
      showSuccess(
        user.enabled
          ? `Đã khóa ${user.username}`
          : `Đã mở khóa ${user.username}`,
      );
    }
  };

  const handleChangeRole = async (role: "STUDENT" | "TEACHER") => {
    if (!modalRole) return;
    const result = await dispatch(
      changeAdminUserRole({ userId: modalRole.id, role }),
    );
    if (changeAdminUserRole.rejected.match(result)) {
      showError((result.payload as string) ?? "Đổi role thất bại");
    } else {
      showSuccess(`Đã đổi role của ${modalRole.username} → ${role}`);
      setModalRole(null);
    }
  };

  const handleResetPassword = async () => {
    if (!modalReset) return;
    const result = await dispatch(resetAdminUserPassword(modalReset.id));
    if (resetAdminUserPassword.rejected.match(result)) {
      showError((result.payload as string) ?? "Reset thất bại");
    } else {
      showSuccess(`Đã reset mật khẩu cho ${modalReset.username}`);
      setModalReset(null);
    }
  };

  const isMutating = mutationStatus === "loading";

  const tableBody = useMemo(() => {
    if (users.status === "loading" && users.content.length === 0) {
      return (
        <tr>
          <td
            colSpan={5}
            className="py-12 text-center text-[var(--muted-foreground)]"
          >
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </td>
        </tr>
      );
    }
    if (users.status === "failed") {
      return (
        <tr>
          <td colSpan={5} className="py-12 text-center text-rose-400">
            {users.error ?? "Lỗi không xác định"}
          </td>
        </tr>
      );
    }
    if (users.content.length === 0) {
      return (
        <tr>
          <td
            colSpan={5}
            className="py-12 text-center text-[var(--muted-foreground)]"
          >
            Không có user nào.
          </td>
        </tr>
      );
    }
    return users.content.map((u) => {
      const isAdmin = u.roles.some((r) => r.toUpperCase() === "ADMIN");
      return (
        <tr
          key={u.id}
          className="hover:bg-[var(--background)] transition-colors"
        >
          <td className="py-3 font-medium text-[var(--foreground)]">
            {u.username}
          </td>
          <td className="py-3">
            <div className="flex flex-wrap gap-1">
              {u.roles.map((r) => roleBadge(r))}
            </div>
          </td>
          <td className="py-3">
            {u.enabled ? (
              <span className="inline-flex rounded-full bg-emerald-500/20 px-2 py-1 text-xs font-medium text-emerald-300">
                Active
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-rose-500/20 px-2 py-1 text-xs font-medium text-rose-300">
                Locked
              </span>
            )}
          </td>
          <td className="py-3 font-mono text-xs text-[var(--muted-foreground)]">
            {u.id.length > 14 ? `${u.id.slice(0, 8)}…${u.id.slice(-4)}` : u.id}
          </td>
          <td className="py-3">
            <div className="flex justify-end gap-2">
              {!isAdmin && (
                <>
                  <button
                    onClick={() => handleLockToggle(u)}
                    disabled={isMutating}
                    className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                      u.enabled
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                    }`}
                  >
                    {u.enabled ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <Unlock className="h-3.5 w-3.5" />
                    )}
                    {u.enabled ? "Khóa" : "Mở"}
                  </button>
                  <button
                    onClick={() => setModalRole(u)}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)] disabled:opacity-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Đổi role
                  </button>
                  <button
                    onClick={() => setModalReset(u)}
                    disabled={isMutating}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                  >
                    Reset
                  </button>
                </>
              )}
              {isAdmin && (
                <span className="text-xs text-[var(--muted-foreground)] italic">
                  Protected
                </span>
              )}
            </div>
          </td>
        </tr>
      );
    });
  }, [users, isMutating, mutationError]);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <Users className="h-7 w-7 text-[var(--primary)]" />
            Quản lý người dùng
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Tổng: {currencyFormatter.format(users.totalElements)} user
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={users.filterRole}
            onChange={handleFilterChange}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
          >
            <option value="">Tất cả role</option>
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button
            onClick={() =>
              dispatch(fetchAdminUsers({ role: users.filterRole || undefined }))
            }
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
          >
            <RefreshCw className="h-4 w-4" />
            Tải lại
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted-foreground)]">
                <th className="pb-3 font-medium">Username</th>
                <th className="pb-3 font-medium">Role</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">User ID</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tableBody}
            </tbody>
          </table>
        </div>
      </div>

      <ChangeRoleModal
        open={modalRole !== null}
        user={modalRole}
        onClose={() => setModalRole(null)}
        onConfirm={handleChangeRole}
        isLoading={isMutating}
      />

      <ResetPasswordModal
        open={modalReset !== null}
        user={modalReset}
        onClose={() => setModalReset(null)}
        onConfirm={handleResetPassword}
        isLoading={isMutating}
      />
    </div>
  );
}

export default AdminUsers;
