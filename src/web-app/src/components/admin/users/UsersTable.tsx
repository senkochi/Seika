import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface UsersTableProps {
  loading: boolean;
  error?: string | null;
  empty: boolean;
  hasRows: boolean;
  children: ReactNode;
}

function UsersTable({
  loading,
  error,
  empty,
  children,
}: UsersTableProps) {
  let body: ReactNode = children;
  if (loading) {
    body = (
      <tr>
        <td
          colSpan={5}
          className="py-12 text-center text-[var(--muted-foreground)]"
        >
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
        </td>
      </tr>
    );
  } else if (error) {
    body = (
      <tr>
        <td colSpan={5} className="py-12 text-center text-rose-400">
          {error}
        </td>
      </tr>
    );
  } else if (empty) {
    body = (
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

  return (
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
      <tbody className="divide-y divide-[var(--border)]">{body}</tbody>
    </table>
  );
}

export default UsersTable;