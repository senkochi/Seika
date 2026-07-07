import { RefreshCw, Users } from "lucide-react";

interface UsersHeaderProps {
  totalElements: number;
  filterRole: string;
  onFilterChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onReload: () => void;
}

const numberFormatter = new Intl.NumberFormat("vi-VN");

function UsersHeader({
  totalElements,
  filterRole,
  onFilterChange,
  onReload,
}: UsersHeaderProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
          <Users className="h-7 w-7 text-[var(--primary)]" />
          Quản lý người dùng
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Tổng: {numberFormatter.format(totalElements)} user
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={filterRole}
          onChange={onFilterChange}
          className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
        >
          <option value="">Tất cả role</option>
          <option value="STUDENT">Student</option>
          <option value="TEACHER">Teacher</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          onClick={onReload}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
        >
          <RefreshCw className="h-4 w-4" />
          Tải lại
        </button>
      </div>
    </div>
  );
}

export default UsersHeader;