import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { getApiErrorMessage } from "../../api/errors";
import {
  adminService,
  type AdminCollusionFlag,
  type AdminCollusionFlagFilter,
  type CollusionAction,
} from "../../api/services/admin";
import type { EscrowTransaction } from "../../api/services/marketplace";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatCard } from "../../components/ui/StatCard";
import { useFormatDate, useFormatNumber } from "../../utils/format";
import { StatusPill } from "../../components/ui/StatusPill";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";

type EscrowFilter =
  | "ALL"
  | "HELD"
  | "PENDING_ADMIN_DECISION"
  | "RELEASED"
  | "REFUNDED";
type ViewTab = "escrow" | "risk";

const ESCROW_FILTERS: EscrowFilter[] = [
  "ALL",
  "HELD",
  "PENDING_ADMIN_DECISION",
  "RELEASED",
  "REFUNDED",
];

function shortId(value: string | null | undefined) {
  if (!value) return "N/A";
  return value.length > 12 ? `${value.slice(0, 8)}…` : value;
}

function statusLabel(escrow: EscrowTransaction) {
  if (escrow.creditRequestedAt && escrow.status === "HELD")
    return "CREDIT_REQUESTED";
  if (escrow.refundRequestedAt && escrow.status === "HELD")
    return "REFUND_REQUESTED";
  if (escrow.needsAdminDecision) return "PENDING_ADMIN_DECISION";
  return escrow.status;
}

function escrowStatusVariant(status: string) {
  switch (status) {
    case "RELEASED":
      return "success" as const;
    case "REFUNDED":
      return "danger" as const;
    case "PENDING_ADMIN_DECISION":
    case "CREDIT_REQUESTED":
    case "REFUND_REQUESTED":
      return "warning" as const;
    default:
      return "neutral" as const;
  }
}

export default function AdminMarketplaceRiskPanel() {
  const formatNum = useFormatNumber();
  const formatDt = useFormatDate();
  const formatCoins = (value: number | null | undefined) =>
    formatNum(value ?? 0);
  const formatDate = (value: string | null | undefined) => {
    if (!value) return "N/A";
    return formatDt(value);
  };
  const [activeTab, setActiveTab] = useState<ViewTab>("escrow");
  const [escrowFilter, setEscrowFilter] = useState<EscrowFilter>("HELD");
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [flags, setFlags] = useState<AdminCollusionFlag[]>([]);
  const [flagStatus, setFlagStatus] =
    useState<AdminCollusionFlagFilter>("SUSPICIOUS");
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadEscrows = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await adminService.listEscrows(escrowFilter);
      setEscrows(rows);
    } catch (error) {
      showError(getApiErrorMessage(error, "Cannot load escrow ledger."));
      setEscrows([]);
    } finally {
      setLoading(false);
    }
  }, [escrowFilter]);

  const loadFlags = useCallback(async () => {
    setLoading(true);
    try {
      const page = await adminService.listCollusionFlags(flagStatus, 0, 20);
      setFlags(page.content);
    } catch (error) {
      showError(getApiErrorMessage(error, "Cannot load collusion flags."));
      setFlags([]);
    } finally {
      setLoading(false);
    }
  }, [flagStatus]);

  useEffect(() => {
    if (activeTab === "escrow") {
      void loadEscrows();
      return;
    }
    void loadFlags();
  }, [activeTab, loadEscrows, loadFlags]);

  const summary = useMemo(() => {
    const held = escrows.filter(
      (e) => e.status === "HELD" || e.needsAdminDecision,
    );
    return {
      heldGross: held.reduce((sum, e) => sum + (e.grossAmount ?? 0), 0),
      paidBacked: held.reduce((sum, e) => sum + (e.paidBackedAmount ?? 0), 0),
      promoBacked: held.reduce((sum, e) => sum + (e.promoBackedAmount ?? 0), 0),
      decisions: escrows.filter((e) => e.needsAdminDecision).length,
    };
  }, [escrows]);

  const decideEscrow = async (
    escrow: EscrowTransaction,
    action: "refund" | "force-release" | "no-refund",
  ) => {
    const defaultReason =
      action === "force-release" ? "admin_test_release" : `admin_${action}`;
    const reason = window.prompt("Decision reason:", defaultReason);
    if (!reason?.trim()) return;
    setActingId(escrow.id);
    try {
      await adminService.decideEscrow(
        escrow.orderItemId,
        action,
        reason.trim(),
      );
      showSuccess("Escrow decision updated.");
      await loadEscrows();
    } catch (error) {
      showError(getApiErrorMessage(error, "Cannot update escrow."));
    } finally {
      setActingId(null);
    }
  };

  const actOnFlag = async (
    flag: AdminCollusionFlag,
    action: CollusionAction,
  ) => {
    const reason = window.prompt("Risk action reason:", action.toLowerCase());
    if (!reason?.trim()) return;
    setActingId(flag.id);
    try {
      await adminService.takeCollusionAction(flag.id, action, reason.trim());
      showSuccess("Collusion flag updated.");
      await loadFlags();
    } catch (error) {
      showError(getApiErrorMessage(error, "Cannot update collusion flag."));
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Marketplace Ops"
        subtitle="Giải phóng escrow, hoàn tiền và rà soát collusion theo tiered economy."
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={() =>
              activeTab === "escrow" ? void loadEscrows() : void loadFlags()
            }
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            )}
            Làm mới
          </Button>
        }
      />

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Marketplace operations"
        className="grid gap-2 sm:grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "escrow"}
          onClick={() => setActiveTab("escrow")}
          className={
            activeTab === "escrow"
              ? "flex items-center gap-3 rounded-xl border border-[#d4a843]/30 bg-[#d4a843]/10 px-4 py-3 text-left font-sans-ui transition-colors"
              : "flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left font-sans-ui text-white/55 hover:text-cream transition-colors"
          }
        >
          <CircleDollarSign
            className={
              activeTab === "escrow" ? "h-5 w-5 text-[#d4a843]" : "h-5 w-5"
            }
            aria-hidden="true"
          />
          <span>
            <span className="block font-medium">Escrow ledger</span>
            <span className="block text-xs text-white/55">
              Giải phóng và hoàn tiền
            </span>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "risk"}
          onClick={() => setActiveTab("risk")}
          className={
            activeTab === "risk"
              ? "flex items-center gap-3 rounded-xl border border-[#d4a843]/30 bg-[#d4a843]/10 px-4 py-3 text-left font-sans-ui transition-colors"
              : "flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-left font-sans-ui text-white/55 hover:text-cream transition-colors"
          }
        >
          <ShieldCheck
            className={
              activeTab === "risk" ? "h-5 w-5 text-[#d4a843]" : "h-5 w-5"
            }
            aria-hidden="true"
          />
          <span>
            <span className="block font-medium">Risk review</span>
            <span className="block text-xs text-white/55">
              Cờ collusion và hold
            </span>
          </span>
        </button>
      </div>

      {activeTab === "escrow" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Held gross"
              value={`${formatCoins(summary.heldGross)}`}
              unit="Coins"
              hint="Tổng giá trị còn kẹt trong escrow"
            />
            <StatCard
              label="Paid-backed"
              value={`${formatCoins(summary.paidBacked)}`}
              unit="Coins"
              hint="Dòng tiền có thể rút được"
              iconVariant="success"
            />
            <StatCard
              label="Promo-backed"
              value={`${formatCoins(summary.promoBacked)}`}
              unit="Coins"
              hint="Dòng app-only hoặc sink"
              iconVariant="warning"
            />
            <StatCard
              label="Needs admin"
              value={String(summary.decisions)}
              hint="Hàng chờ admin xử lý"
              iconVariant="danger"
            />
          </div>

          <SectionCard className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans-ui text-base font-semibold text-cream">
                Escrow transactions
              </h2>
              <p className="font-sans-ui text-sm text-white/55 mt-1">
                Dùng Force release để test mà không cần chờ hết hold days.
              </p>
            </div>
            <select
              value={escrowFilter}
              onChange={(event) =>
                setEscrowFilter(event.target.value as EscrowFilter)
              }
              className="h-10 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 font-sans-ui text-sm text-cream focus:outline-none focus:border-[#d4a843]/50 transition-colors"
            >
              {ESCROW_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </SectionCard>

          <SectionCard className="overflow-hidden p-0">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-2 font-sans-ui text-white/55 p-10">
                <Loader2
                  className="h-5 w-5 animate-spin text-[#d4a843]"
                  aria-hidden="true"
                />
                Đang tải escrow…
              </div>
            ) : escrows.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  title="Không có escrow nào khớp filter"
                  description="Thử đổi trạng thái khác hoặc làm mới."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left font-sans-ui text-sm">
                  <thead className="border-b border-white/[0.06] text-[10px] uppercase tracking-[0.12em] text-white/45">
                    <tr>
                      <th className="px-4 py-3">Sản phẩm</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Paid</th>
                      <th className="px-4 py-3 text-right">Promo</th>
                      <th className="px-4 py-3">Release at</th>
                      <th className="px-4 py-3">Parties</th>
                      <th className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {escrows.map((escrow) => {
                      const status = statusLabel(escrow);
                      const canAct =
                        escrow.status === "HELD" || escrow.needsAdminDecision;
                      return (
                        <tr
                          key={escrow.id}
                          className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-4 py-3">
                            <div className="font-medium text-cream">
                              {escrow.productType}
                            </div>
                            <div
                              className="font-mono text-xs text-white/55"
                              title={escrow.productId}
                            >
                              {shortId(escrow.productId)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill variant={escrowStatusVariant(status)}>
                              {status}
                            </StatusPill>
                            {escrow.lastWalletError && (
                              <p className="mt-1 text-xs text-red-300">
                                {escrow.lastWalletError}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-cream tabular-nums">
                            {formatCoins(escrow.grossAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-300 tabular-nums">
                            {formatCoins(escrow.paidBackedAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-amber-300 tabular-nums">
                            {formatCoins(escrow.promoBackedAmount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-white/55">
                            {formatDate(escrow.releaseAt)}
                          </td>
                          <td className="px-4 py-3 text-xs text-white/55">
                            <div>Buyer {shortId(escrow.buyerId)}</div>
                            <div>Seller {shortId(escrow.sellerId)}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  void decideEscrow(escrow, "force-release")
                                }
                                disabled={!canAct || actingId === escrow.id}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1.5 font-sans-ui text-xs font-medium text-emerald-300 hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                              >
                                <CheckCircle2
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />{" "}
                                Release
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void decideEscrow(escrow, "refund")
                                }
                                disabled={!canAct || actingId === escrow.id}
                                className="inline-flex items-center gap-1 rounded-md border border-red-400/25 bg-red-400/10 px-2 py-1.5 font-sans-ui text-xs font-medium text-red-300 hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                              >
                                <XCircle
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />{" "}
                                Refund
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void decideEscrow(escrow, "no-refund")
                                }
                                disabled={
                                  !escrow.needsAdminDecision ||
                                  actingId === escrow.id
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 font-sans-ui text-xs font-medium text-cream hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-40 transition-colors"
                              >
                                <Clock
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />{" "}
                                Hold
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SectionCard>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-sans-ui text-base font-semibold text-cream">
                  Cờ collusion
                </h2>
                <p className="font-sans-ui text-sm text-white/55 mt-1">
                  Rà soát các cặp buyer–seller có dấu hiệu bất thường.
                </p>
              </div>
              <select
                value={flagStatus}
                onChange={(event) =>
                  setFlagStatus(event.target.value as AdminCollusionFlagFilter)
                }
                className="h-10 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 font-sans-ui text-sm text-cream focus:outline-none focus:border-[#d4a843]/50 transition-colors"
              >
                <option value="SUSPICIOUS">SUSPICIOUS</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="MALICIOUS">MALICIOUS</option>
                <option value="DISMISSED">DISMISSED</option>
                <option value="ALL">ALL</option>
              </select>
            </div>
            <div className="max-h-[34rem] overflow-y-auto pr-1 custom-scrollbar">
              {loading ? (
                <div className="flex min-h-40 items-center justify-center gap-2 font-sans-ui text-white/55 py-10">
                  <Loader2
                    className="h-5 w-5 animate-spin text-[#d4a843]"
                    aria-hidden="true"
                  />
                  Đang tải cờ…
                </div>
              ) : flags.length === 0 ? (
                <EmptyState
                  title="Không có cờ nào khớp filter"
                  description="Thử đổi trạng thái hoặc làm mới."
                />
              ) : (
                <div className="space-y-3 font-sans-ui">
                  {flags.map((flag) => (
                    <div
                      key={flag.id}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-cream">
                            Risk {flag.riskScore} · {flag.transactionCount} tx
                          </p>
                          <p className="mt-1 text-xs text-white/55">
                            Teacher {shortId(flag.teacherId)} · Buyer{" "}
                            {shortId(flag.buyerId)} ·{" "}
                            {formatDate(flag.createdAt)}
                          </p>
                          <p className="mt-2 text-xs text-white/55 tabular-nums">
                            Promo {(flag.promoBackedRatio * 100).toFixed(0)}% ·
                            No consume {(flag.noConsumeRatio * 100).toFixed(0)}%
                            · Reciprocal{" "}
                            {(flag.reciprocalRatio * 100).toFixed(0)}%
                          </p>
                        </div>
                        <StatusPill
                          variant={
                            flag.status === "SUSPICIOUS"
                              ? "warning"
                              : flag.status === "CONFIRMED"
                                ? "info"
                                : flag.status === "MALICIOUS"
                                  ? "danger"
                                  : "neutral"
                          }
                        >
                          {flag.status}
                        </StatusPill>
                      </div>
                      {flag.status === "SUSPICIOUS" && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="md"
                            onClick={() =>
                              void actOnFlag(flag, "CONFIRM_COLLUSION")
                            }
                            disabled={actingId === flag.id}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="ghost"
                            tone="danger"
                            size="md"
                            onClick={() =>
                              void actOnFlag(flag, "MARK_MALICIOUS")
                            }
                            disabled={actingId === flag.id}
                          >
                            Malicious
                          </Button>
                          <Button
                            variant="ghost"
                            size="md"
                            onClick={() => void actOnFlag(flag, "DISMISS")}
                            disabled={actingId === flag.id}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="flex items-start gap-3 font-sans-ui">
              <AlertTriangle
                className="mt-1 h-5 w-5 text-amber-300"
                aria-hidden="true"
              />
              <div>
                <h2 className="font-sans-ui text-base font-semibold text-cream">
                  Plan v3 coverage
                </h2>
                <p className="mt-2 text-sm leading-6 text-white/55">
                  Admin giờ có thể truy vết lineage escrow, force-release các
                  hàng đang giữ để dev test, hoàn tiền các giao dịch chưa xử lý,
                  và rà soát cờ collusion. Báo cáo doanh thu vẫn phụ thuộc
                  ledger của wallet-service và nên tách khỏi phần promo sink
                  accounting.
                </p>
                <Button
                  variant="ghost"
                  size="md"
                  className="mt-4"
                  onClick={() => setActiveTab("escrow")}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Quay lại escrow ledger
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
