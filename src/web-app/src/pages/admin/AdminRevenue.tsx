import { useEffect, useState, useCallback, useMemo } from "react";
import {
  TrendingUp,
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

function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  icon: any;
  accent: string;
}) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[var(--muted-foreground)] text-sm font-medium">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--foreground)] truncate">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-[var(--muted-foreground)] font-mono truncate">
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} shadow-lg`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
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
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
          <p>Đang tải dữ liệu tài chính và doanh thu nền tảng...</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-4xl">⚠️</div>
          <p className="text-[var(--foreground)] font-bold text-lg">
            Lỗi tải dữ liệu tài chính
          </p>
          <p className="text-[var(--muted-foreground)] text-sm max-w-md">
            {error}
          </p>
          <button
            onClick={() => void fetchData()}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90 shadow-md transition-all"
          >
            <RefreshCcw className="h-4 w-4" /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <TrendingUp className="h-7 w-7 text-[var(--primary)]" />
            Quản lý Thu nhập & Tài chính Nền tảng
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Theo dõi dòng tiền thực tế nạp/rút, lợi nhuận chênh lệch tỷ giá và
            nợ phải trả tiềm năng của hệ thống.
          </p>
        </div>
        <button
          onClick={() => void fetchData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng dòng tiền vào (Inflow)"
          value={formatCurrency(stats?.totalTopupVnd)}
          subtitle={`${formatNumber(stats?.totalTopupCoins)} Coins đã nạp (${stats?.currentTopupRate ?? 100} ₫/Coin)`}
          icon={ArrowUpRight}
          accent="from-emerald-500 to-teal-600"
        />
        <StatCard
          label="Tổng chi trả (Outflow)"
          value={formatCurrency(stats?.totalWithdrawalVnd)}
          subtitle={`${formatNumber(stats?.totalWithdrawalCoins)} Coins đã rút (${stats?.currentWithdrawalRate ?? 90} ₫/Coin)`}
          icon={ArrowDownRight}
          accent="from-rose-500 to-pink-600"
        />
        <StatCard
          label="Lợi nhuận ròng hiện tại (Net Revenue)"
          value={formatCurrency(stats?.netRevenueVnd)}
          subtitle="Chênh lệch thực tế thu vào trừ chi trả"
          icon={DollarSign}
          accent="from-blue-500 to-cyan-600"
        />
        <StatCard
          label="Nợ phải trả tiềm năng (Escrow Liability)"
          value={formatCurrency(stats?.potentialLiabilityVnd)}
          subtitle={`${formatNumber(stats?.totalCoinCirculation)} Coins lưu hành × ${stats?.currentWithdrawalRate ?? 90} ₫`}
          icon={ShieldAlert}
          accent="from-amber-400 to-yellow-500"
        />
      </div>

      {/* Guaranteed Profit Banner */}
      <div className="rounded-2xl border border-[var(--primary)]/30 bg-gradient-to-r from-[var(--primary)]/10 via-[var(--card)] to-[var(--card)] p-6 backdrop-blur-xl shadow-[0_20px_60px_rgba(10,10,20,0.28)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-lg">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)]">
              Lợi nhuận đảm bảo tối thiểu của nền tảng:{" "}
              <span className="text-[var(--primary)]">
                {formatCurrency(stats?.guaranteedProfitVnd)}
              </span>
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
              Phần lợi nhuận chắc chắn thuộc về nền tảng từ chênh lệch tỷ giá
              Nạp - Rút (ngay cả khi toàn bộ user rút sạch Coin lưu hành).
            </p>
          </div>
        </div>
      </div>

      {/* Transactions Table Section */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <FileText className="h-5 w-5 text-[var(--primary)]" />
              Lịch sử đối soát dòng tiền toàn hệ thống
            </h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Sắp xếp từ mới nhất đến cũ nhất. Dùng bộ lọc để kiểm tra dòng tiền
              vào và ra.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === "ALL"
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)] shadow"
                  : "text-[var(--muted-foreground)]"
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setFilterType("TOP_UP")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                filterType === "TOP_UP"
                  ? "bg-emerald-600 text-white shadow"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" /> Nạp VNĐ
            </button>
            <button
              onClick={() => setFilterType("CASH_OUT")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                filterType === "CASH_OUT"
                  ? "bg-rose-600 text-white shadow"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              <ArrowDownRight className="h-3.5 w-3.5" /> Rút VNĐ
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)] text-xs uppercase font-semibold">
                <th className="pb-3 pr-4">Thời gian</th>
                <th className="pb-3 pr-4">User ID</th>
                <th className="pb-3 pr-4">Loại giao dịch</th>
                <th className="pb-3 pr-4 text-right">Biến động Coin</th>
                <th className="pb-3 pr-4 text-right">Quy đổi VNĐ</th>
                <th className="pb-3">Mô tả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-8 text-center text-[var(--muted-foreground)] text-sm"
                  >
                    Không có giao dịch nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isTopup = tx.type === "TOP_UP";
                  const isCashout = tx.type === "CASH_OUT";
                  const isReward =
                    tx.type === "REWARD" || tx.type === "DEPOSIT";

                  let badgeColor = "bg-secondary text-secondary-foreground";
                  let badgeLabel = tx.type;
                  if (isTopup) {
                    badgeColor =
                      "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
                    badgeLabel = "NẠP TIỀN (INFLOW)";
                  } else if (isCashout) {
                    badgeColor =
                      "bg-rose-500/10 text-rose-500 border border-rose-500/20";
                    badgeLabel = "RÚT TIỀN (OUTFLOW)";
                  } else if (isReward) {
                    badgeColor =
                      "bg-blue-500/10 text-blue-500 border border-blue-500/20";
                    badgeLabel = "THU NHẬP / THƯỞNG";
                  }

                  const coinSign = isTopup || isReward ? "+" : "-";
                  const coinColor =
                    isTopup || isReward
                      ? "text-emerald-500"
                      : "text-rose-500 font-medium";

                  return (
                    <tr key={tx.id || Math.random().toString()}>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-xs text-[var(--muted-foreground)] font-mono">
                        {formatDate(tx.createdAt)}
                      </td>
                      <td
                        className="py-3.5 pr-4 whitespace-nowrap font-mono text-xs text-[var(--foreground)] max-w-[120px] truncate"
                        title={tx.userId}
                      >
                        {tx.userId ? `${tx.userId.substring(0, 8)}...` : "N/A"}
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${badgeColor}`}
                        >
                          {badgeLabel}
                        </span>
                      </td>
                      <td
                        className={`py-3.5 pr-4 whitespace-nowrap text-right font-mono font-bold ${coinColor}`}
                      >
                        {coinSign}
                        {formatNumber(Math.abs(tx.amount || 0))} Coins
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-right font-mono font-semibold text-[var(--foreground)]">
                        {tx.amountVnd && tx.amountVnd > 0 ? (
                          <span
                            className={
                              isTopup
                                ? "text-emerald-500"
                                : isCashout
                                  ? "text-rose-500"
                                  : ""
                            }
                          >
                            {isTopup ? "+" : isCashout ? "-" : ""}
                            {formatCurrency(tx.amountVnd)}
                          </span>
                        ) : (
                          <span className="text-[var(--muted-foreground)] text-xs">
                            --
                          </span>
                        )}
                      </td>
                      <td
                        className="py-3.5 text-xs text-[var(--foreground)] max-w-xs md:max-w-md truncate"
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
      </div>
    </div>
  );
}
