import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  DollarSign,
  ShieldAlert,
  RefreshCcw,
  Loader2,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  CircleOff,
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
import { useFormatDate, useFormatNumber } from "../../utils/format";
import { getAdminTransactionPresentation } from "./adminRevenuePresentation";

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
      className={`px-3.5 py-1.5 rounded-lg font-sans-ui text-xs font-medium transition-all ${
        active
          ? "bg-[#d4a843] text-[#1c0f2e] shadow-sm font-semibold"
          : "bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function AdminRevenue() {
  const { t } = useTranslation("admin");
  const formatNum = useFormatNumber();
  const formatDt = useFormatDate();
  const formatCurrency = (value: number | undefined | null) =>
    formatNum(value ?? 0, {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  const formatNumber = (value: number | undefined | null) =>
    formatNum(value ?? 0);
  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return "N/A";
    return formatDt(dateStr, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
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
      setError(err?.message || t("revenue.error.default"));
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
          <Loader2
            className="w-8 h-8 animate-spin text-[#d4a843]"
            aria-hidden="true"
          />
          <p>{t("revenue.loading")}</p>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon={<ShieldAlert className="w-5 h-5" aria-hidden="true" />}
          title={t("revenue.error.title")}
          description={error}
          action={
            <Button variant="ghost" size="md" onClick={() => void fetchData()}>
              <RefreshCcw className="w-4 h-4" aria-hidden="true" />{" "}
              {t("revenue.error.retry")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title={t("revenue.title")}
        subtitle={t("revenue.subtitle")}
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
            {t("revenue.refresh")}
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={t("revenue.kpi.inflow.label")}
          value={formatCurrency(stats?.totalTopupVnd)}
          unit=""
          icon={<ArrowUpRight className="w-4 h-4" aria-hidden="true" />}
          iconVariant="success"
          hint={t("revenue.kpi.inflow.hint", {
            coins: formatNumber(stats?.totalTopupCoins),
            rate: formatNumber(
              stats?.averageTopupRate ?? stats?.currentTopupRate ?? 100,
            ),
          })}
        />
        <StatCard
          label={t("revenue.kpi.outflow.label")}
          value={formatCurrency(stats?.totalWithdrawalVnd)}
          icon={<ArrowDownRight className="w-4 h-4" aria-hidden="true" />}
          iconVariant="danger"
          hint={t("revenue.kpi.outflow.hint", {
            coins: formatNumber(stats?.totalWithdrawalCoins),
            rate: formatNumber(
              stats?.averageWithdrawalRate ??
                stats?.currentWithdrawalRate ??
                90,
            ),
          })}
        />
        <StatCard
          label={t("revenue.kpi.paidBacked.label")}
          value={formatCurrency(
            stats?.paidBackedFeeEstimatedVnd ?? stats?.realRevenueVnd,
          )}
          icon={<DollarSign className="w-4 h-4" aria-hidden="true" />}
          iconVariant="info"
          hint={t("revenue.kpi.paidBacked.hint", {
            coins: formatNumber(stats?.paidBackedFeeCoins),
            rate: formatNumber(stats?.currentTopupRate ?? 100),
          })}
        />
        <StatCard
          label={t("revenue.kpi.promoSink.label")}
          value={formatNumber(stats?.promoSinkCoins) + " Coins"}
          icon={<CircleOff className="w-4 h-4" aria-hidden="true" />}
          iconVariant="gold"
          hint={t("revenue.kpi.promoSink.hint")}
        />
        <StatCard
          label={t("revenue.kpi.liability.label")}
          value={formatCurrency(stats?.cashOutLiabilityVnd)}
          icon={<ShieldAlert className="w-4 h-4" aria-hidden="true" />}
          iconVariant="warning"
          hint={t("revenue.kpi.liability.hint", {
            coins: formatNumber(stats?.withdrawableCoinCirculation),
            rate: formatNumber(stats?.currentWithdrawalRate ?? 90),
          })}
        />
      </div>

      {/* Current Liability Snapshot */}
      <SectionCard>
        <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
          <IconChip variant="gold" className="h-12 w-12 shrink-0">
            <Coins className="w-5 h-5" aria-hidden="true" />
          </IconChip>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-sans-ui text-base font-semibold text-cream">
                {t("revenue.guaranteedProfit.title")}
              </h3>
              <StatusPill variant="warning">
                {t("revenue.guaranteedProfit.badge")}
              </StatusPill>
            </div>
            <p className="font-sans-ui text-3xl font-semibold text-cream tabular-nums mt-2">
              {formatCurrency(
                stats?.netCashAfterCurrentLiabilityVnd ??
                  stats?.guaranteedProfitVnd,
              )}
            </p>
            <p className="mt-1 text-sm text-white/55 font-sans-ui">
              {t("revenue.guaranteedProfit.subtitle", {
                withdrawableCoins: formatNumber(
                  stats?.withdrawableCoinCirculation,
                ),
                paidCoins: formatNumber(stats?.paidCoinCirculation),
              })}
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
              {t("revenue.transactions.title")}
            </h2>
            <p className="font-sans-ui text-xs text-white/55 mt-0.5">
              {t("revenue.transactions.subtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <FilterChip
              active={filterType === "ALL"}
              onClick={() => setFilterType("ALL")}
            >
              {t("revenue.transactions.filter.all")}
            </FilterChip>
            <FilterChip
              active={filterType === "TOP_UP"}
              onClick={() => setFilterType("TOP_UP")}
            >
              {t("revenue.transactions.filter.topUp")}
            </FilterChip>
            <FilterChip
              active={filterType === "CASH_OUT"}
              onClick={() => setFilterType("CASH_OUT")}
            >
              {t("revenue.transactions.filter.cashOut")}
            </FilterChip>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-sm font-sans-ui">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/45 text-xs uppercase tracking-wider">
                <th className="pb-3 pr-4">
                  {t("revenue.transactions.headers.time")}
                </th>
                <th className="pb-3 pr-4">
                  {t("revenue.transactions.headers.userId")}
                </th>
                <th className="pb-3 pr-4">
                  {t("revenue.transactions.headers.type")}
                </th>
                <th className="pb-3 pr-4 text-right">
                  {t("revenue.transactions.headers.coinChange")}
                </th>
                <th className="pb-3 pr-4 text-right">
                  {t("revenue.transactions.headers.vnd")}
                </th>
                <th className="pb-3">
                  {t("revenue.transactions.headers.desc")}
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title={t("revenue.transactions.empty.title")}
                      description={t("revenue.transactions.empty.desc")}
                    />
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const amount = tx.amount ?? 0;
                  const presentation = getAdminTransactionPresentation(
                    tx.type,
                    tx.source,
                    tx.flowDirection,
                  );

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
                      <td className="py-3.5 pr-4 whitespace-nowrap">
                        <StatusPill variant={presentation.pillVariant}>
                          {t(presentation.labelKey)}
                        </StatusPill>
                      </td>
                      <td
                        className={`py-3.5 pr-4 whitespace-nowrap text-right font-mono font-medium tabular-nums ${presentation.valueClassName}`}
                      >
                        {presentation.sign}
                        {formatNumber(Math.abs(amount))} Coins
                      </td>
                      <td className="py-3.5 pr-4 whitespace-nowrap text-right font-mono text-cream tabular-nums">
                        {tx.amountVnd && tx.amountVnd > 0 ? (
                          <span className={presentation.valueClassName}>
                            {presentation.sign}
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
                        {tx.description || t("revenue.transactions.noDesc")}
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
