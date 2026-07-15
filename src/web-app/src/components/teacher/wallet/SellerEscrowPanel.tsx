import { AlertTriangle, Clock, Loader2, ShieldCheck } from "lucide-react";

import type { EscrowTransaction } from "../../../api/services/marketplace";

interface SellerEscrowPanelProps {
  escrows: EscrowTransaction[];
  loading: boolean;
}

function formatCoins(value: number | null | undefined) {
  return (value ?? 0).toLocaleString("vi-VN");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "N/A";
  return new Date(value).toLocaleString("vi-VN");
}

function statusLabel(escrow: EscrowTransaction) {
  if (escrow.needsAdminDecision) return "Needs admin";
  if (escrow.creditRequestedAt && escrow.status === "HELD") return "Releasing";
  if (escrow.status === "HELD") return "Held escrow";
  if (escrow.status === "RELEASED") return "Released";
  if (escrow.status === "REFUNDED") return "Refunded";
  return escrow.status;
}

export default function SellerEscrowPanel({
  escrows,
  loading,
}: SellerEscrowPanelProps) {
  const activeEscrows = escrows.filter(
    (e) => e.status === "HELD" || e.needsAdminDecision,
  );
  const escrowPending = activeEscrows.reduce(
    (sum, e) => sum + (e.grossAmount ?? 0),
    0,
  );
  const paidBacked = activeEscrows.reduce(
    (sum, e) => sum + (e.paidBackedAmount ?? 0),
    0,
  );
  const decisionCount = escrows.filter((e) => e.needsAdminDecision).length;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] backdrop-blur-xl p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            Escrow pending release
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Marketplace earnings enter the wallet only after escrow release.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--second-card)] px-4 py-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              Dang cho escrow
            </p>
            <p className="font-mono text-lg font-bold text-[var(--foreground)]">
              {formatCoins(escrowPending)}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
            <p className="text-xs text-emerald-200">Paid-backed</p>
            <p className="font-mono text-lg font-bold text-emerald-300">
              {formatCoins(paidBacked)}
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3">
            <p className="text-xs text-amber-200">Can xu ly</p>
            <p className="font-mono text-lg font-bold text-amber-300">
              {decisionCount}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading escrows...
        </div>
      ) : escrows.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
          No paid marketplace order is currently in seller escrow.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted-foreground)]">
                <th className="pb-3 pr-4">Product</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 pr-4 text-right">Gross</th>
                <th className="pb-3 pr-4 text-right">Paid-backed</th>
                <th className="pb-3 pr-4 text-right">Promo-backed</th>
                <th className="pb-3 pr-4">Release at</th>
                <th className="pb-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {escrows.map((escrow) => (
                <tr key={escrow.id}>
                  <td className="py-3 pr-4">
                    <div className="font-semibold text-[var(--foreground)]">
                      {escrow.productType}
                    </div>
                    <div
                      className="max-w-[12rem] truncate font-mono text-xs text-[var(--muted-foreground)]"
                      title={escrow.productId}
                    >
                      {escrow.productId}
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${escrow.needsAdminDecision ? "border border-amber-400/30 bg-amber-400/10 text-amber-300" : "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"}`}
                    >
                      {escrow.needsAdminDecision ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {statusLabel(escrow)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-[var(--foreground)]">
                    {formatCoins(escrow.grossAmount)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono font-bold text-emerald-300">
                    {formatCoins(escrow.paidBackedAmount)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono font-bold text-amber-300">
                    {formatCoins(escrow.promoBackedAmount)}
                  </td>
                  <td className="whitespace-nowrap py-3 pr-4 text-xs text-[var(--muted-foreground)]">
                    {formatDate(escrow.releaseAt)}
                  </td>
                  <td className="py-3 text-xs text-[var(--muted-foreground)]">
                    {escrow.reviewReason || escrow.lastWalletError || "--"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
