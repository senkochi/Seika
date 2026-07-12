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

function statusLabel(status: string, needsAdminDecision: boolean) {
  if (needsAdminDecision) return "Chờ admin quyết định";
  if (status === "HELD") return "Đang giữ escrow";
  if (status === "CREDIT_REQUESTED") return "Đang release";
  if (status === "RELEASED") return "Đã release";
  if (status === "REFUNDED") return "Đã hoàn";
  return status;
}

export default function SellerEscrowPanel({
  escrows,
  loading,
}: SellerEscrowPanelProps) {
  const heldTotal = escrows
    .filter((e) => e.status === "HELD" || e.status === "CREDIT_REQUESTED")
    .reduce(
      (sum, e) =>
        sum + (e.teacherWithdrawableNet ?? 0) + (e.teacherPromoNet ?? 0),
      0,
    );
  const decisionCount = escrows.filter((e) => e.needsAdminDecision).length;

  return (
    <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-lg shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
            <ShieldCheck className="h-5 w-5 text-amber-400" />
            Escrow đang chờ release
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Doanh thu marketplace chỉ vào ví sau khi escrow được release.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--second-card)] px-4 py-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              Dự kiến nhận
            </p>
            <p className="font-mono text-lg font-bold text-[var(--foreground)]">
              {formatCoins(heldTotal)} Coins
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--second-card)] px-4 py-3">
            <p className="text-xs text-[var(--muted-foreground)]">Cần xử lý</p>
            <p className="font-mono text-lg font-bold text-amber-300">
              {decisionCount}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải escrow...
        </div>
      ) : escrows.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
          Chưa có khoản escrow nào từ đơn marketplace đã thanh toán.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted-foreground)]">
                <th className="pb-3 pr-4">Sản phẩm</th>
                <th className="pb-3 pr-4">Trạng thái</th>
                <th className="pb-3 pr-4 text-right">Gross</th>
                <th className="pb-3 pr-4 text-right">Teacher net</th>
                <th className="pb-3 pr-4">Release lúc</th>
                <th className="pb-3">Ghi chú</th>
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
                      {statusLabel(escrow.status, escrow.needsAdminDecision)}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-[var(--foreground)]">
                    {formatCoins(escrow.grossAmount)}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono font-bold text-green-400">
                    {formatCoins(
                      (escrow.teacherWithdrawableNet ?? 0) +
                        (escrow.teacherPromoNet ?? 0),
                    )}
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap text-xs text-[var(--muted-foreground)]">
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
