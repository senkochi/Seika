import { AlertTriangle, Clock, Loader2, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { EscrowTransaction } from "../../../api/services/marketplace";
import { useFormatDate, useFormatNumber } from "../../../utils/format";

interface SellerEscrowPanelProps {
  escrows: EscrowTransaction[];
  loading: boolean;
}

function statusLabel(escrow: EscrowTransaction, t: (key: string) => string) {
  if (escrow.needsAdminDecision) return t("escrow.statusAdminDecision");
  if (escrow.creditRequestedAt && escrow.status === "HELD")
    return t("escrow.statusReleasing");
  if (escrow.status === "HELD") return t("escrow.statusHeld");
  if (escrow.status === "RELEASED") return t("escrow.statusReleased");
  if (escrow.status === "REFUNDED") return t("escrow.statusRefunded");
  return escrow.status;
}

export default function SellerEscrowPanel({
  escrows,
  loading,
}: SellerEscrowPanelProps) {
  const { t } = useTranslation("wallet");
  const formatNum = useFormatNumber();
  const formatDt = useFormatDate();

  const formatCoins = (value: number | null | undefined) =>
    formatNum(value ?? 0);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return "N/A";
    return formatDt(value);
  };
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
            <ShieldCheck
              className="h-5 w-5 text-amber-400"
              aria-hidden="true"
            />
            {t("escrow.title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            {t("escrow.subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-[var(--border)] bg-[var(--second-card)] px-4 py-3">
            <p className="text-xs text-[var(--muted-foreground)]">
              {t("escrow.pendingLabel")}
            </p>
            <p className="font-mono text-lg font-bold text-[var(--foreground)]">
              {formatCoins(escrowPending)}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
            <p className="text-xs text-emerald-200">{t("escrow.paidBacked")}</p>
            <p className="font-mono text-lg font-bold text-emerald-300">
              {formatCoins(paidBacked)}
            </p>
          </div>
          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3">
            <p className="text-xs text-amber-200">
              {t("escrow.needsDecision")}
            </p>
            <p className="font-mono text-lg font-bold text-amber-300">
              {decisionCount}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[var(--muted-foreground)]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />{" "}
          {t("escrow.loading")}
        </div>
      ) : escrows.length === 0 ? (
        <div className="py-10 text-center text-sm text-[var(--muted-foreground)]">
          {t("escrow.empty")}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-xs uppercase text-[var(--muted-foreground)]">
                <th className="pb-3 pr-4">{t("escrow.colProduct")}</th>
                <th className="pb-3 pr-4">{t("escrow.colStatus")}</th>
                <th className="pb-3 pr-4 text-right">{t("escrow.colGross")}</th>
                <th className="pb-3 pr-4 text-right">
                  {t("escrow.colPaidBacked")}
                </th>
                <th className="pb-3 pr-4 text-right">
                  {t("escrow.colPromoBacked")}
                </th>
                <th className="pb-3 pr-4">{t("escrow.colReleaseAt")}</th>
                <th className="pb-3">{t("escrow.colNote")}</th>
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
                        <AlertTriangle
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                      ) : (
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                      {statusLabel(escrow, t)}
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
