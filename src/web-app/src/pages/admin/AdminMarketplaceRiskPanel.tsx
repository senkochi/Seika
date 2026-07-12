import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import {
  adminService,
  type AdminCollusionFlag,
  type CollusionAction,
} from "../../api/services/admin";
import type { EscrowTransaction } from "../../api/services/marketplace";
import { showError, showSuccess } from "../../components/toast/toastUtils";

function formatCoins(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("vi-VN");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN");
}

function shortId(value: string | null | undefined) {
  if (!value) return "N/A";
  return value.length > 10 ? `${value.slice(0, 8)}...` : value;
}

export default function AdminMarketplaceRiskPanel() {
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [flags, setFlags] = useState<AdminCollusionFlag[]>([]);
  const [flagStatus, setFlagStatus] = useState("OPEN");
  const [loading, setLoading] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingEscrows, flagsPage] = await Promise.all([
        adminService.listPendingEscrowDecisions().catch(() => []),
        adminService.listCollusionFlags(flagStatus, 0, 10).catch(() => ({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
        })),
      ]);
      setEscrows(pendingEscrows);
      setFlags(flagsPage.content);
    } catch (err) {
      console.error(err);
      showError("Không thể tải dữ liệu risk review marketplace.");
    } finally {
      setLoading(false);
    }
  }, [flagStatus]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const decideEscrow = async (
    escrow: EscrowTransaction,
    action: "refund" | "force-release" | "no-refund",
  ) => {
    const reason = window.prompt("Lý do quyết định:");
    if (!reason?.trim()) return;
    setActingId(escrow.id);
    try {
      await adminService.decideEscrow(
        escrow.orderItemId,
        action,
        reason.trim(),
      );
      showSuccess("Đã cập nhật quyết định escrow.");
      void loadData();
    } catch (err: any) {
      showError(err?.response?.data?.message ?? "Không thể cập nhật escrow.");
    } finally {
      setActingId(null);
    }
  };

  const actOnFlag = async (
    flag: AdminCollusionFlag,
    action: CollusionAction,
  ) => {
    const reason = window.prompt("Lý do xử lý flag:");
    if (!reason?.trim()) return;
    setActingId(flag.id);
    try {
      await adminService.takeCollusionAction(flag.id, action, reason.trim());
      showSuccess("Đã cập nhật collusion flag.");
      void loadData();
    } catch (err: any) {
      showError(
        err?.response?.data?.message ?? "Không thể cập nhật collusion flag.",
      );
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--foreground)]">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            Marketplace Risk Review
          </h2>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Duyệt escrow bất thường và xử lý cảnh báo collusion từ
            marketplace-service.
          </p>
        </div>
        <button
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Làm mới risk review
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-[var(--foreground)]">
              Escrow cần quyết định
            </h3>
            <span className="rounded-md bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-300">
              {escrows.length}
            </span>
          </div>
          <div className="max-h-[24rem] overflow-y-auto pr-1">
            {escrows.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                Không có escrow nào đang chờ admin.
              </div>
            ) : (
              <div className="space-y-3">
                {escrows.map((escrow) => (
                  <div
                    key={escrow.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--foreground)]">
                          {escrow.productType} ·{" "}
                          {formatCoins(escrow.grossAmount)} Coins
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          Buyer {shortId(escrow.buyerId)} · Seller{" "}
                          {shortId(escrow.sellerId)} · Release{" "}
                          {formatDate(escrow.releaseAt)}
                        </p>
                        {escrow.reviewReason && (
                          <p className="mt-2 text-xs text-amber-300">
                            {escrow.reviewReason}
                          </p>
                        )}
                      </div>
                      <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          void decideEscrow(escrow, "force-release")
                        }
                        disabled={actingId === escrow.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Release
                      </button>
                      <button
                        onClick={() => void decideEscrow(escrow, "refund")}
                        disabled={actingId === escrow.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Refund
                      </button>
                      <button
                        onClick={() => void decideEscrow(escrow, "no-refund")}
                        disabled={actingId === escrow.id}
                        className="rounded-lg bg-[var(--second-card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--second-muted)] disabled:opacity-50"
                      >
                        No refund
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-semibold text-[var(--foreground)]">
              Collusion flags
            </h3>
            <select
              value={flagStatus}
              onChange={(event) => setFlagStatus(event.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs text-[var(--foreground)]"
            >
              <option value="OPEN">OPEN</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="MALICIOUS">MALICIOUS</option>
              <option value="DISMISSED">DISMISSED</option>
              <option value="ALL">ALL</option>
            </select>
          </div>
          <div className="max-h-[24rem] overflow-y-auto pr-1">
            {flags.length === 0 ? (
              <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
                Không có collusion flag phù hợp.
              </div>
            ) : (
              <div className="space-y-3">
                {flags.map((flag) => (
                  <div
                    key={flag.id}
                    className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">
                          Risk {flag.riskScore} · {flag.transactionCount} giao
                          dịch
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                          Teacher {shortId(flag.teacherId)} · Buyer{" "}
                          {shortId(flag.buyerId)} · {formatDate(flag.createdAt)}
                        </p>
                        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                          Promo {(flag.promoBackedRatio * 100).toFixed(0)}% · No
                          consume {(flag.noConsumeRatio * 100).toFixed(0)}% ·
                          Reciprocal {(flag.reciprocalRatio * 100).toFixed(0)}%
                        </p>
                      </div>
                      <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-1 text-xs font-bold text-amber-300">
                        {flag.status}
                      </span>
                    </div>
                    {flag.status === "OPEN" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            void actOnFlag(flag, "CONFIRM_COLLUSION")
                          }
                          disabled={actingId === flag.id}
                          className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => void actOnFlag(flag, "MARK_MALICIOUS")}
                          disabled={actingId === flag.id}
                          className="rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 disabled:opacity-50"
                        >
                          Malicious
                        </button>
                        <button
                          onClick={() => void actOnFlag(flag, "DISMISS")}
                          disabled={actingId === flag.id}
                          className="rounded-lg bg-[var(--second-card)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--second-muted)] disabled:opacity-50"
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
      </div>
    </div>
  );
}
