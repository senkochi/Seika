import { Lock, RefreshCw, Unlock } from "lucide-react";

import type { UserAdminResponse } from "../../../api/types";
import { Button } from "../../ui/Button";
import { StatusPill } from "../../ui/StatusPill";

interface UsersTableRowProps {
  user: UserAdminResponse;
  isMutating: boolean;
  onLockToggle: (user: UserAdminResponse) => void;
  onChangeRole: (user: UserAdminResponse) => void;
  onResetPassword: (user: UserAdminResponse) => void;
}

function roleVariant(role: string) {
  const upper = role.toUpperCase();
  if (upper === "ADMIN") return "danger" as const;
  if (upper === "TEACHER") return "gold" as const;
  return "info" as const;
}

const compactBtn =
  "!h-8 !px-3 !text-xs gap-1.5 rounded-full";

function UsersTableRow({
  user,
  isMutating,
  onLockToggle,
  onChangeRole,
  onResetPassword,
}: UsersTableRowProps) {
  const isAdmin = user.roles.some((r) => r.toUpperCase() === "ADMIN");

  return (
    <tr className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
      <td className="py-3 pr-4 font-sans-ui font-medium text-cream">
        {user.username}
      </td>
      <td className="py-3 pr-4">
        <div className="flex flex-wrap gap-1">
          {user.roles.map((r) => (
            <StatusPill key={r} variant={roleVariant(r)}>
              {r}
            </StatusPill>
          ))}
        </div>
      </td>
      <td className="py-3 pr-4">
        <StatusPill variant={user.enabled ? "success" : "neutral"}>
          {user.enabled ? "Active" : "Locked"}
        </StatusPill>
      </td>
      <td className="py-3 pr-4 font-mono text-xs text-white/55 tabular-nums">
        {user.id.length > 14
          ? `${user.id.slice(0, 8)}…${user.id.slice(-4)}`
          : user.id}
      </td>
      <td className="py-3">
        <div className="flex justify-end gap-2">
          {!isAdmin ? (
            <>
              <Button
                variant="ghost"
                size="md"
                className={compactBtn}
                onClick={() => onLockToggle(user)}
                disabled={isMutating}
              >
                {user.enabled ? (
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {user.enabled ? "Khóa" : "Mở"}
              </Button>
              <Button
                variant="ghost"
                size="md"
                className={compactBtn}
                onClick={() => onChangeRole(user)}
                disabled={isMutating}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Đổi role
              </Button>
              <Button
                variant="ghost"
                tone="danger"
                size="md"
                className={compactBtn}
                onClick={() => onResetPassword(user)}
                disabled={isMutating}
              >
                Reset
              </Button>
            </>
          ) : (
            <span className="font-sans-ui text-xs italic text-white/45">
              Protected
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default UsersTableRow;