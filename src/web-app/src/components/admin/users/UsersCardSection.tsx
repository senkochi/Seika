import type { ReactNode } from "react";

import { Pagination } from "../../ui/Pagination";
import UsersTable from "./UsersTable";

interface UsersCardSectionProps {
  loading: boolean;
  error: string | null;
  empty: boolean;
  hasRows: boolean;
  page: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  children: ReactNode;
}

function UsersCardSection({
  loading,
  error,
  empty,
  hasRows,
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
  children,
}: UsersCardSectionProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
      <div className="overflow-x-auto">
        <UsersTable
          loading={loading}
          error={error}
          empty={empty}
          hasRows={hasRows}
        >
          {children}
        </UsersTable>
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={pageSize}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}

export default UsersCardSection;