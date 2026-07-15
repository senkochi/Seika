import { useEffect, useState, useCallback, useMemo } from "react";
import {
  DollarSign,
  ShieldAlert,
  RefreshCcw,
  Loader2,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
} from "lucide-react";
import { adminService } from "../../api/services/admin";
import type {
  AdminRevenueStats,
  AdminTransactionResponse,
} from "../../api/types";
import { Pagination } from "../../components/ui/Pagination";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatCard } from "../../components/ui/StatCard";
import { IconChip } from "../../components/ui/IconChip";
import { StatusPill } from "../../components/ui/StatusPill";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("vi-VN");

function formatCurrency(value: number | undefined | null) {
  return currencyFormatter.format(value ?? 0);
}

function formatNumber(value: number | undefined | null) {
  return numberFormatter.format(value ?? 0);
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return dateStr;
  }
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "px-3 py-1.5 rounded-full border border-[#d4a843]/30 bg-[#d4a843]/10 text-[#d4a843] text-xs font-sans-ui transition-colors"
          : "px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-cream text-xs font-sans-ui transition-colors"
      }
    >
      {children}
    </button>
  );
}

export default function AdminRevenue() {
  const [stats, setStats] = useState<AdminRevenueStats | null>(null);
  const [transactions, setTransactions] = useState<AdminTransactionResponse[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);

  useEffect(() => {
    setCurrentPage(0);
  }, [filterType]);

  const totalPages = Math.ceil(transactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = currentPage * pageSize;
    return transactions.slice(start, start + pageSize);
  }, [transactions, currentPage, pageSize]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, txData] = await Promise.all([
        adminService.getRevenueStats(),
        adminService.getSystemTransactions(filterType),
      ]);
      setStats(statsData);
      setTransactions(txData);
    } catch (err: any) {
      setError(err?.message || "Không thể tải dữ liệu thống kê tài chính.");
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading && !stats) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-white/55 font-sans-ui">
          <Loader2 className="w-8 h-8 animate-spin text-[#d4a843]" aria-hidden="true" />
          <p>Đang tải dữ liệu tài chính và doanh thu nền tảng…</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon={<ShieldAlert className="w-5 h-5" aria-hidden="true" />}
          title="Lỗi tải dữ liệu tài chính"
          description={error}
          action={
            <Button variant="ghost" size="md" onClick={() => void fetchData()}>
              <RefreshCcw className="w-4 h-4" aria-hidden="true" /> Thử lại
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Quản lý Thu nhập & Tài chính Nền tảng"
        subtitle="Theo dõi dòng tiền thực tế nạp/rút, lợi nhuận chênh lệch tỷ giá và nợ phải trả tiềm năng của hệ thống."
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={() => void fetchData()}
            disabled={loading}
          >
            <RefreshCcw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />{" "}
            Làm mới
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng dòng tiền vào (Inflow)"
          value={formatCurrency(stats?.totalTopupVnd)}
          unit=""
          icon={<ArrowUpRight className="w-4 h-4" aria-hidden="true" />}
          iconVariant="success"
          hint={`${formatNumber(stats?.totalTopupCoins)} Coins đã nạp (${stats?.currentTopupRate ?? 100} ₫/Coin)`}
        />
        <StatCard
          label="Tổng chi trả (Outflow)"
          value={formatCurrency(stats?.totalWithdrawalVnd)}
          icon={<ArrowDownRight className="w-4 h-4" aria-hidden="true" />}
          iconVariant="danger"
          hint={`${formatNumber(stats?.totalWithdrawalCoins)} Coins đã rút (${stats?.currentWithdrawalRate ?? 90} ₫/Coin)`}
        />
        <StatCard
          label="Lợi nhuận ròng (Net)"
          value={formatCurrency(stats?.netRevenueVnd)}
          icon={<DollarSign className="w-4 h-4" aria-hidden="true" />}
          iconVariant="info"
          hint="Chênh lệch thực tế thu vào trừ chi trả"
        />
        <StatCard
          label="Nợ phải trả tiềm năng"
          value={formatCurrency(stats?.potentialLiabilityVnd)}
          icon={<ShieldAlert className="w-4 h-4" aria-hidden="true" />}
          iconVariant="warning"
          hint={`${formatNumber(stats?.totalCoinCirculation)} Coins lưu hành × ${stats?.currentWithdrawalRate ?? 90} ₫`}
        />
      </div>

      {/* Guaranteed Profit Banner */}
      <SectionCard>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <IconChip variant="gold" className="h-12 w-12 shrink-0">
            <Coins className="w-5 h-5" aria-hidden="true" />
          </IconChip>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans-ui text-base font-semibold text-cream">
                Lợi nhuận đảm bảo tối thiểu của nền tảng
              </h3>
              <StatusPill variant="success">Locked in</StatusPill>
            </div>
            <p className="font-sans-ui text-3xl font-semibold text-cream tabular-nums mt-2">
              {formatCurrency(stats?.guaranteedProfitVnd)}
            </p>
            <p className="mt-1 text-sm text-white/55 font-sans-ui">
              Phần lợi nhuận chắc chắn thuộc về nền tảng từ chênh lệch tỷ giá
              Nạp - Rút (ngay cả khi toàn bộ user rút sạch Coin lưu hành).
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Transactions Table */}
      <SectionCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="font-sans-ui text-base font-semibold text-cream flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
              Lịch sử đối soát dòng tiền toàn hệ thống
            </h2>
            <p className="font-sans-ui text-xs text-white/55 mt-0.5">
              Sắp xếp từ mới nhất đến cũ nhất. Dùng bộ lọc để kiểm tra dòng
              tiền vào và ra.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip active={filterType === "ALL"} onClick={() => setFilterType("ALL")}>
              Tất cả
            </FilterChip>
            <FilterChip active={filterType === "TOP_UP"} onClick={() => setFilterType("TOP_UP")}>
              Nạp VNĐ
            </FilterChip>
            <FilterChip active={filterType === "CASH_OUT"} onClick={() => setFilterType("CASH_OUT")}>
              Rút VNĐ
            </FilterChip>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm font-sans-ui">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/45 text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4">Thời gian</th>
                <th className="pb-3 pr-4">User ID</th>
                <th className="pb-3 pr-4">Loại giao dịch</th>
                <th className="pb-3 pr-4 text-right">Biến động Coin</th>
                <th className="pb-3 pr-4 text-right">Quy đổi VNĐ</th>
                <th className="pb-3">Mô tả</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="Không có giao dịch nào"
                      description="Thử đổi bộ lọc hoặc quay lại sau khi có hoạt động mới."
                    />
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isTopup = tx.type === "TOP_UP";
                  const isCashout = tx.type === "CASH_OUT";
                  const isReward =
                    tx.type === "REWARD" || tx.type === "DEPOSIT";

                  let pill: React.ReactNode = null;
                  if (isTopup) {
                    pill = <StatusPill variant="success">Nạp tiền</StatusPill>;
                  } else if (isCashout) {
                    pill = <StatusPill variant="danger">Rút tiền</StatusPill>;
                  } else if (isReward) {
                    pill = <StatusPill variant="info">Thu nhập / Thưởng</StatusPill>;
                  } else {
                    pill = <StatusPill variant="neutral">{tx.type}</StatusPill>;
                  }

                  const coinSign = isTopup || isReward ? "+" : "-";
                  const coinColor =
                    isTopup || isReward ? "text-emerald-300" : "text-red-300";

                  return (
                    <tr
                      key={tx.id || Math.random().toString()}
                      className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-white/55 font-mono">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td
                        className="py-3.5 pr-4 whitespace-nowrap font-mono text-xs text-cream max-w-[120px] truncate"
                        title={tx.userId}
                      >
                        {tx.userId ? `${tx.userId.substring(0, 8)}…` : "N/A"}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">{pill}</td>
                      <td
                        className={`py-3.5 pr-4 whitespace-nowrap text-right font-mono font-medium tabular-nums ${coinColor}`}
                      >
                        {coinSign}
                        {formatNumber(Math.abs(tx.amount || 0))} Coins
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-right font-mono text-cream tabular-nums">
                        {tx.amountVnd && tx.amountVnd > 0 ? (
                          <span
                            className={
                              isTopup
                                ? "text-emerald-300"
                                : isCashout
                                  ? "text-red-300"
                                  : ""
                            }
                          >
                            {isTopup ? "+" : isCashout ? "-" : ""}
                            {formatCurrency(tx.amountVnd)}
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs">—</span>
                        )}
                      </td>
                      <td
                        className="py-3.5 text-xs text-white/75 max-w-xs md:max-w-md truncate"
                        title={tx.description}
                      >
                        {tx.description || "Không có mô tả"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalElements={transactions.length}
          pageSize={pageSize}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(0);
          }}
        />
      </SectionCard>
    </div>
  );
}