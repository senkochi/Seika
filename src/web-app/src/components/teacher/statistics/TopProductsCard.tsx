import { useTranslation } from "react-i18next";
import type { TopProduct } from "../../../api/types";
import StatisticsLoadingState from "./StatisticsLoadingState";
import { useOverviewFormatters } from "./OverviewStatsGrid";

interface TopProductsCardProps {
  products: TopProduct[];
  status: "idle" | "loading" | "succeeded" | "failed";
  onOpenAttempts: (quizSetId: string) => void;
}

function TopProductsCard({
  products,
  status,
  onOpenAttempts,
}: TopProductsCardProps) {
  const { t } = useTranslation("teacher");
  const { formatCurrency, formatNumber } = useOverviewFormatters();
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        {t("statistics.topProductsTitle")}
      </h2>
      {status === "loading" ? (
        <StatisticsLoadingState message={t("statistics.loading")} />
      ) : !products || products.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          {t("statistics.topProductsEmpty")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted-foreground)]">
                <th className="pb-3 font-medium">
                  {t("statistics.colProduct")}
                </th>
                <th className="pb-3 font-medium">{t("statistics.colType")}</th>
                <th className="pb-3 font-medium text-right">
                  {t("statistics.colPrice")}
                </th>
                <th className="pb-3 font-medium text-right">
                  {t("statistics.colOrders")}
                </th>
                <th className="pb-3 font-medium text-right">
                  {t("statistics.colRevenue")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((product) => (
                <tr
                  key={product.productId}
                  onClick={() => {
                    if (product.productType === "QUIZ_SET") {
                      onOpenAttempts(product.productId);
                    }
                  }}
                  className={
                    product.productType === "QUIZ_SET"
                      ? "cursor-pointer hover:bg-[var(--background)]"
                      : ""
                  }
                >
                  <td className="py-3 font-medium text-[var(--foreground)]">
                    {product.productName}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex rounded-md bg-[var(--primary)]/15 px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                      {product.productType === "FLASHCARD_SET"
                        ? t("statistics.typeFlashcard")
                        : product.productType === "QUIZ_SET"
                          ? t("statistics.typeQuiz")
                          : product.productType}
                    </span>
                  </td>
                  <td className="py-3 text-right text-[var(--foreground)]">
                    {formatCurrency(product.unitPrice)}
                  </td>
                  <td className="py-3 text-right text-[var(--foreground)]">
                    {formatNumber(product.totalSold)}
                  </td>
                  <td className="py-3 text-right font-semibold text-[var(--foreground)]">
                    {formatCurrency(product.totalRevenue)}
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

export default TopProductsCard;
