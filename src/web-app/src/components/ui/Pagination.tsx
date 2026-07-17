import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useFormatNumber } from "../../utils/format";

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

/**
 * Pagination — hairline-bordered, no drop shadow on the active pill, gold
 * active state. Public API unchanged (still 0-indexed currentPage) so all
 * existing callers continue to work.
 */
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
  const formatNumber = useFormatNumber();
  if (totalPages <= 1 && !totalElements) return null;

  const startItem = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endItem =
    totalElements === undefined
      ? (currentPage + 1) * pageSize
      : Math.min((currentPage + 1) * pageSize, totalElements);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 0; i < totalPages; i++) {
        pages.push(i);
      }
    } else {
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

      if (totalPages > 1) {
        pages.push(totalPages - 1);
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  const btnBase =
    "flex h-8 min-w-[2rem] items-center justify-center px-2.5 rounded-lg border text-xs font-sans-ui transition-colors tabular-nums";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-white/[0.06] text-sm text-white/55 font-sans-ui ${className}`}
    >
      <div className="flex items-center gap-4">
        {totalElements !== undefined && (
          <div>
            Hiển thị{" "}
            <span className="font-semibold text-cream">{startItem}</span> -{" "}
            <span className="font-semibold text-cream">{endItem}</span> trên
            tổng số{" "}
            <span className="font-semibold text-cream">
              {formatNumber(totalElements)}
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
              className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 py-1 text-xs font-medium text-cream focus:outline-none focus:border-[#d4a843]/50 transition-colors"
            >
              {pageSizeOptions.map((size) => (
                <option
                  key={size}
                  value={size}
                  className="bg-[#1c0f2e] text-cream"
                >
                  {size} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(0)}
            disabled={currentPage === 0}
            title="Trang đầu"
            aria-label="Trang đầu"
            className={`${btnBase} bg-white/[0.02] border-white/[0.08] text-white/65 hover:bg-white/[0.06] hover:text-cream disabled:opacity-30 disabled:pointer-events-none`}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 0}
            title="Trang trước"
            aria-label="Trang trước"
            className={`${btnBase} bg-white/[0.02] border-white/[0.08] text-white/65 hover:bg-white/[0.06] hover:text-cream disabled:opacity-30 disabled:pointer-events-none`}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center gap-1 px-1">
            {pages.map((page, idx) => {
              if (page === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-2 text-xs text-white/30"
                    aria-hidden="true"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = page === currentPage;
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  aria-current={isCurrent ? "page" : undefined}
                  aria-label={`Trang ${page + 1}`}
                  className={
                    isCurrent
                      ? `${btnBase} bg-[#d4a843]/10 border-[#d4a843]/30 text-[#d4a843]`
                      : `${btnBase} bg-white/[0.02] border-white/[0.08] text-white/65 hover:bg-white/[0.06] hover:text-cream`
                  }
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
            aria-label="Trang sau"
            className={`${btnBase} bg-white/[0.02] border-white/[0.08] text-white/65 hover:bg-white/[0.06] hover:text-cream disabled:opacity-30 disabled:pointer-events-none`}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={currentPage >= totalPages - 1}
            title="Trang cuối"
            aria-label="Trang cuối"
            className={`${btnBase} bg-white/[0.02] border-white/[0.08] text-white/65 hover:bg-white/[0.06] hover:text-cream disabled:opacity-30 disabled:pointer-events-none`}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        </nav>
      )}
    </div>
  );
}
