import { Lock, RefreshCw, Unlock } from "lucide-react";

import type { UserAdminResponse } from "../../../api/types";
import RoleBadge from "./RoleBadge";
import UserStatusPill from "./UserStatusPill";

interface UsersTableRowProps {
  user: UserAdminResponse;
  isMutating: boolean;
  onLockToggle: (user: UserAdminResponse) => void;
  onChangeRole: (user: UserAdminResponse) => void;
  onResetPassword: (user: UserAdminResponse) => void;
}

function UsersTableRow({
  user,
  isMutating,
  onLockToggle,
  onChangeRole,
  onResetPassword,
}: UsersTableRowProps) {
  const isAdmin = user.roles.some((r) => r.toUpperCase() === "ADMIN");

  return (
    <tr className="hover:bg-[var(--background)] transition-colors">
      <td className="py-3 font-medium text-[var(--foreground)]">
        {user.username}
      </td>
      <td className="py-3">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <RoleBadge key={r} role={r} />
          ))}
        </div>
      </td>
      <td className="py-3">
        <UserStatusPill enabled={user.enabled} />
      </td>
      <td className="py-3 font-mono text-xs text-[var(--muted-foreground)]">
        {user.id.length > 14
          ? `${user.id.slice(0, 8)}…${user.id.slice(-4)}`
          : user.id}
      </td>
      <td className="py-3">
        <div className="flex justify-end gap-2">
          {!isAdmin && (
            <>
              <button
                onClick={() => onLockToggle(user)}
                disabled={isMutating}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                  user.enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                    : "border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20"
                }`}
              >
                {user.enabled ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" />
                )}
                {user.enabled ? "Khóa" : "Mở"}
              </button>
              <button
                onClick={() => onChangeRole(user)}
                disabled={isMutating}
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)] hover:border-[var(--primary)] disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Đổi role
              </button>
              <button
                onClick={() => onResetPassword(user)}
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
}

export default UsersTableRow;