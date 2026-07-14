import { RefreshCw } from "lucide-react";

import { PageHeader } from "../../ui/PageHeader";
import { Button } from "../../ui/Button";

interface UsersHeaderProps {
  totalElements: number;
  filterRole: string;
  onFilterChange: (role: string) => void;
  onReload: () => void;
}

const ROLE_FILTERS = [
  { value: "", label: "Tất cả role" },
  { value: "STUDENT", label: "Student" },
  { value: "TEACHER", label: "Teacher" },
  { value: "ADMIN", label: "Admin" },
] as const;

const numberFormatter = new Intl.NumberFormat("vi-VN");

function UsersHeader({
  totalElements,
  filterRole,
  onFilterChange,
  onReload,
}: UsersHeaderProps) {
  return (
    <PageHeader
      title="Quản lý người dùng"
      subtitle={`Tổng ${numberFormatter.format(totalElements)} user`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Lọc theo role"
            className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.02] p-1"
          >
            {ROLE_FILTERS.map((opt) => {
              const active = filterRole === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onFilterChange(opt.value)}
                  aria-pressed={active}
                  className={
                    active
                      ? "rounded-full bg-[#d4a843]/10 border border-[#d4a843]/30 px-3 py-1 text-xs font-medium text-[#d4a843] transition-colors"
                      : "rounded-full border border-transparent px-3 py-1 text-xs font-medium text-white/60 hover:bg-white/[0.04] hover:text-cream transition-colors"
                  }
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <Button variant="ghost" size="md" onClick={onReload}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Tải lại
          </Button>
        </div>
      }
    />
  );
}

export default UsersHeader;