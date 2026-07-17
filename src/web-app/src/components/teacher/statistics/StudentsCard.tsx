import { useTranslation } from "react-i18next";
import type { StudentPurchase } from "../../../api/types";
import StatisticsLoadingState from "./StatisticsLoadingState";
import { formatCurrency } from "./OverviewStatsGrid";
import { useFormatDate } from "../../../utils/format";

interface StudentsCardProps {
  entries: StudentPurchase[];
  status: "idle" | "loading" | "succeeded" | "failed";
}

function StudentsCard({ entries, status }: StudentsCardProps) {
  const { t } = useTranslation("teacher");
  const formatDate = useFormatDate();
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        {t("statistics.studentsTitle")}
      </h2>
      {status === "loading" ? (
        <StatisticsLoadingState message={t("statistics.loading")} />
      ) : !entries || entries.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          {t("statistics.studentsEmpty")}
        </p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--card)] backdrop-blur-md">
              <tr className="text-left text-[var(--muted-foreground)]">
                <th className="pb-3 font-medium">
                  {t("statistics.colStudent")}
                </th>
                <th className="pb-3 font-medium">
                  {t("statistics.colProduct")}
                </th>
                <th className="pb-3 font-medium text-right">
                  {t("statistics.colPrice")}
                </th>
                <th className="pb-3 font-medium">{t("statistics.colDate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {entries.map((entry, idx) => (
                <tr key={`${entry.userId}-${entry.productId}-${idx}`}>
                  <td className="py-3 font-mono text-xs text-[var(--foreground)]">
                    {entry.userId.length > 14
                      ? `${entry.userId.slice(0, 8)}…${entry.userId.slice(-4)}`
                      : entry.userId}
                  </td>
                  <td className="py-3 text-[var(--foreground)]">
                    {entry.productName}
                  </td>
                  <td className="py-3 text-right text-[var(--foreground)]">
                    {formatCurrency(entry.unitPrice)}
                  </td>
                  <td className="py-3 text-[var(--muted-foreground)]">
                    {formatDate(entry.purchasedAt)}
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

export default StudentsCard;
