import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface UsersTableProps {
  loading: boolean;
  error?: string | null;
  empty: boolean;
  hasRows: boolean;
  children: ReactNode;
}

/**
 * Plain table primitive used by AdminUsers. Body is swapped by the parent
 * via children; this component only owns the thead + the empty/loading/
 * error fallback rows. Visual treatment mirrors AdminContentModeration.
 */
function UsersTable({ loading, error, empty, children }: UsersTableProps) {
  const { t } = useTranslation("admin");
  let body: ReactNode = children;
  if (loading) {
    body = (
      <tr>
        <td
          colSpan={5}
          className="py-12 text-center font-sans-ui text-white/55"
        >
          <Loader2
            className="mx-auto h-6 w-6 animate-spin text-[#d4a843]"
            aria-hidden="true"
          />
        </td>
      </tr>
    );
  } else if (error) {
    body = (
      <tr>
        <td colSpan={5} className="py-12 text-center font-sans-ui text-red-300">
          {error}
        </td>
      </tr>
    );
  } else if (empty) {
    body = (
      <tr>
        <td
          colSpan={5}
          className="py-12 text-center font-sans-ui text-white/55"
        >
          {t("users.table.empty")}
        </td>
      </tr>
    );
  }

  return (
    <table className="w-full font-sans-ui text-sm">
      <thead>
        <tr className="text-left text-[10px] uppercase tracking-[0.12em] text-white/45 border-b border-white/[0.06]">
          <th className="pb-3 pr-4 font-medium">
            {t("users.table.headers.username")}
          </th>
          <th className="pb-3 pr-4 font-medium">
            {t("users.table.headers.role")}
          </th>
          <th className="pb-3 pr-4 font-medium">
            {t("users.table.headers.status")}
          </th>
          <th className="pb-3 pr-4 font-medium">
            {t("users.table.headers.userId")}
          </th>
          <th className="pb-3 font-medium text-right">
            {t("users.table.headers.actions")}
          </th>
        </tr>
      </thead>
      <tbody>{body}</tbody>
    </table>
  );
}

export default UsersTable;
