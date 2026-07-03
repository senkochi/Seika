import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number; // 0-indexed
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  className = "",
}: PaginationProps) {
  if (totalPages <= 1 && !totalElements) return null;

  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem =
    totalElements === undefined
      ? (currentPage + 1) * pageSize
      : Math.min((currentPage + 1) * pageSize, totalElements);

  // Generate page numbers to display (0-indexed internally)
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always add first page
      pages.push(0);

      if (currentPage > 2) {
        pages.push("ellipsis");
      }

      const start = Math.max(1, currentPage - 1);
      const end = Math.min(totalPages - 2, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 3) {
        pages.push("ellipsis");
      }

      // Always add last page
      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-[var(--border)] text-sm text-[var(--muted-foreground)] ${className}`}
    >
      <div className="flex items-center gap-4">
        {totalElements !== undefined && (
          <div>
            Hiển thị{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {startItem}
            </span>{" "}
            -{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {endItem}
            </span>{" "}
            trên tổng số{" "}
            <span className="font-semibold text-[var(--foreground)]">
              {new Intl.NumberFormat("vi-VN").format(totalElements)}
            </span>{" "}
            kết quả
          </div>
        )}

        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-2.5 py-1 text-xs font-medium text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] transition-colors"
            >
              {pageSizeOptions.map((size) => (
                <option
                  key={size}
                  value={size}
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  {size} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            title="Trang đầu"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            title="Trang trước"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {pages.map((page, idx) => {
              if (page === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-xs text-[var(--muted-foreground)]"
                  >
                    •••
                  </span>
                );
              }

              const isCurrent = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[2rem] h-8 px-2.5 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-md shadow-[var(--primary)]/20 border border-[var(--primary)]"
                      : "border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[var(--foreground)]/20"
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            title="Trang sau"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            title="Trang cuối"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
