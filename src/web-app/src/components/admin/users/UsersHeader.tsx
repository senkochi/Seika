import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "../../ui/PageHeader";
import { Button } from "../../ui/Button";

interface UsersHeaderProps {
  totalElements: number;
  filterRole: string;
  onFilterChange: (role: string) => void;
  onReload: () => void;
}

function UsersHeader({
  totalElements,
  filterRole,
  onFilterChange,
  onReload,
}: UsersHeaderProps) {
  const { t } = useTranslation("admin");

  const roleFilters = [
    { value: "", label: t("users.filter.all") },
    { value: "STUDENT", label: t("users.filter.student") },
    { value: "TEACHER", label: t("users.filter.teacher") },
    { value: "ADMIN", label: t("users.filter.admin") },
  ];

  return (
    <PageHeader
      title={t("users.title")}
      subtitle={t("users.subtitle", { count: totalElements })}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter by role"
            className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1"
          >
            {roleFilters.map((opt) => {
              const active = filterRole === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFilterChange(opt.value)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-lg bg-[#d4a843]/10 border border-[#d4a843]/30 px-3 py-1 text-xs font-medium text-[#d4a843] transition-colors"
                      : "rounded-lg border border-transparent px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/[0.04] hover:text-cream transition-colors"
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="md" onClick={onReload}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            {t("users.reload")}
          </Button>
        </div>
      }
    />
  );
}

export default UsersHeader;
