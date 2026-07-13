import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Loader2,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { getApiErrorMessage } from "../../api/errors";
import {
  adminService,
  type AdminCollusionFlag,
  type CollusionAction,
} from "../../api/services/admin";
import type { EscrowTransaction } from "../../api/services/marketplace";
import { showError, showSuccess } from "../../components/toast/toastUtils";

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

function formatCoins(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("vi-VN");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN");
}

function shortId(value: string | null | undefined) {
  if (!value) return "N/A";
  return value.length > 12 ? `${value.slice(0, 8)}...` : value;
}

function statusLabel(escrow: EscrowTransaction) {
  if (escrow.creditRequestedAt && escrow.status === "HELD")
    return "CREDIT_REQUESTED";
  if (escrow.refundRequestedAt && escrow.status === "HELD")
    return "REFUND_REQUESTED";
  if (escrow.needsAdminDecision) return "PENDING_ADMIN_DECISION";
  return escrow.status;
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: string;
  tone?: "neutral" | "ok" | "warn" | "danger";
}) {
  const toneClass = {
    neutral:
      "border-[var(--border)] bg-[var(--second-card)] text-[var(--foreground)]",
    ok: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    warn: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    danger: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-bold ${toneClass}`}
    >
      {children}
    </span>
  );
}

function SummaryTile({
  label,
  value,
  sublabel,
}: {
  label: string;
  value: string;
  sublabel: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
      <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">
        {label}
      </p>
      <p className="mt-2 font-mono text-2xl font-bold text-[var(--foreground)]">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--muted-foreground)]">{sublabel}</p>
    </div>
  );
}

export default function AdminMarketplaceRiskPanel() {
  const [activeTab, setActiveTab] = useState<ViewTab>("escrow");
  const [escrowFilter, setEscrowFilter] = useState<EscrowFilter>("HELD");
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [flags, setFlags] = useState<AdminCollusionFlag[]>([]);
  const [flagStatus, setFlagStatus] = useState("OPEN");
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
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
            <ShieldAlert className="h-7 w-7 text-[var(--primary)]" />
            Marketplace Ops
          </h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Escrow release, refund decisions, and collusion review for the
            tiered economy.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            activeTab === "escrow" ? void loadEscrows() : void loadFlags()
          }
          disabled={loading}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      <div
        role="tablist"
        aria-label="Marketplace operations"
        className="grid gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] p-2 sm:grid-cols-2"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "escrow"}
          onClick={() => setActiveTab("escrow")}
          className={`flex items-center gap-3 rounded-md px-3 py-3 text-left ${activeTab === "escrow" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[rgba(255,255,255,0.06)]"}`}
        >
          <CircleDollarSign className="h-5 w-5" />
          <span>
            <span className="block font-semibold">Escrow ledger</span>
            <span className="block text-xs opacity-80">
              Release and refund operations
            </span>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "risk"}
          onClick={() => setActiveTab("risk")}
          className={`flex items-center gap-3 rounded-md px-3 py-3 text-left ${activeTab === "risk" ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "text-[var(--muted-foreground)] hover:bg-[rgba(255,255,255,0.06)]"}`}
        >
          <ShieldCheck className="h-5 w-5" />
          <span>
            <span className="block font-semibold">Risk review</span>
            <span className="block text-xs opacity-80">
              Collusion flags and holds
            </span>
          </span>
        </button>
      </div>

      {activeTab === "escrow" ? (
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <SummaryTile
              label="Held gross"
              value={`${formatCoins(summary.heldGross)} Coins`}
              sublabel="Gross amount still in escrow"
            />
            <SummaryTile
              label="Paid-backed"
              value={`${formatCoins(summary.paidBacked)} Coins`}
              sublabel="Potential withdrawable lineage"
            />
            <SummaryTile
              label="Promo-backed"
              value={`${formatCoins(summary.promoBacked)} Coins`}
              sublabel="App-only lineage or sink"
            />
            <SummaryTile
              label="Needs admin"
              value={String(summary.decisions)}
              sublabel="Manual decision queue"
            />
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[var(--foreground)]">
                Escrow transactions
              </h2>
              <p className="text-sm text-[var(--muted-foreground)]">
                Use Force release for dev testing without waiting for hold days.
              </p>
            </div>
            <select
              value={escrowFilter}
              onChange={(event) =>
                setEscrowFilter(event.target.value as EscrowFilter)
              }
              className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)]"
            >
              {ESCROW_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
            {loading ? (
              <div className="flex min-h-64 items-center justify-center gap-2 text-[var(--muted-foreground)]">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading escrows...
              </div>
            ) : escrows.length === 0 ? (
              <div className="p-10 text-center text-sm text-[var(--muted-foreground)]">
                No escrow transactions match this filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-sm">
                  <thead className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted-foreground)]">
                    <tr>
                      <th className="px-4 py-3">Product</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Gross</th>
                      <th className="px-4 py-3 text-right">Paid</th>
                      <th className="px-4 py-3 text-right">Promo</th>
                      <th className="px-4 py-3">Release at</th>
                      <th className="px-4 py-3">Parties</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    {escrows.map((escrow) => {
                      const status = statusLabel(escrow);
                      const canAct =
                        escrow.status === "HELD" || escrow.needsAdminDecision;
                      return (
                        <tr key={escrow.id}>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-[var(--foreground)]">
                              {escrow.productType}
                            </div>
                            <div
                              className="font-mono text-xs text-[var(--muted-foreground)]"
                              title={escrow.productId}
                            >
                              {shortId(escrow.productId)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              tone={
                                escrow.needsAdminDecision
                                  ? "warn"
                                  : status === "RELEASED"
                                    ? "ok"
                                    : status === "REFUNDED"
                                      ? "danger"
                                      : "neutral"
                              }
                            >
                              {status}
                            </Badge>
                            {escrow.lastWalletError && (
                              <p className="mt-1 text-xs text-rose-300">
                                {escrow.lastWalletError}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-[var(--foreground)]">
                            {formatCoins(escrow.grossAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-300">
                            {formatCoins(escrow.paidBackedAmount)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-amber-300">
                            {formatCoins(escrow.promoBackedAmount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--muted-foreground)]">
                            {formatDate(escrow.releaseAt)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
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
                                className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Release
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void decideEscrow(escrow, "refund")
                                }
                                disabled={!canAct || actingId === escrow.id}
                                className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Refund
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
                                className="inline-flex items-center gap-1 rounded-md bg-[var(--second-card)] px-2 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--second-muted)] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Clock className="h-3.5 w-3.5" /> Hold
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
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-[var(--foreground)]">
                  Collusion flags
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Review suspicious buyer-seller patterns.
                </p>
              </div>
              <select
                value={flagStatus}
                onChange={(event) => setFlagStatus(event.target.value)}
                className="h-10 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)]"
              >
                <option value="OPEN">OPEN</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="MALICIOUS">MALICIOUS</option>
                <option value="DISMISSED">DISMISSED</option>
                <option value="ALL">ALL</option>
              </select>
            </div>
            <div className="max-h-[34rem] overflow-y-auto pr-1">
              {loading ? (
                <div className="flex min-h-40 items-center justify-center gap-2 text-[var(--muted-foreground)]">
                  <Loader2 className="h-5 w-5 animate-spin" /> Loading flags...
                </div>
              ) : flags.length === 0 ? (
                <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                  No flags match this filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {flags.map((flag) => (
                    <div
                      key={flag.id}
                      className="rounded-lg border border-[var(--border)] bg-[var(--background)] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[var(--foreground)]">
                            Risk {flag.riskScore} - {flag.transactionCount} tx
                          </p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                            Teacher {shortId(flag.teacherId)} - Buyer{" "}
                            {shortId(flag.buyerId)} -{" "}
                            {formatDate(flag.createdAt)}
                          </p>
                          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                            Promo {(flag.promoBackedRatio * 100).toFixed(0)}% -
                            No consume {(flag.noConsumeRatio * 100).toFixed(0)}%
                            - Reciprocal{" "}
                            {(flag.reciprocalRatio * 100).toFixed(0)}%
                          </p>
                        </div>
                        <Badge tone="warn">{flag.status}</Badge>
                      </div>
                      {flag.status === "OPEN" && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              void actOnFlag(flag, "CONFIRM_COLLUSION")
                            }
                            disabled={actingId === flag.id}
                            className="rounded-md bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                          >
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              void actOnFlag(flag, "MARK_MALICIOUS")
                            }
                            disabled={actingId === flag.id}
                            className="rounded-md bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            Malicious
                          </button>
                          <button
                            type="button"
                            onClick={() => void actOnFlag(flag, "DISMISS")}
                            disabled={actingId === flag.id}
                            className="rounded-md bg-[var(--second-card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--second-muted)] disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-1 h-5 w-5 text-amber-300" />
              <div>
                <h2 className="font-semibold text-[var(--foreground)]">
                  Plan v3 coverage
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                  Admin can now inspect escrow lineage, force-release held rows
                  for dev testing, refund unresolved purchases, and review
                  collusion flags. Revenue reporting still depends on
                  wallet-service ledger stats and should remain separate from
                  promo sink accounting.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("escrow")}
                  className="mt-4 inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--primary)]"
                >
                  <RotateCcw className="h-4 w-4" /> Back to escrow ledger
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
