import type { TopProduct } from "../../../api/types";
import StatisticsLoadingState from "./StatisticsLoadingState";
import { formatCurrency, formatNumber } from "./OverviewStatsGrid";

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
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Sản phẩm bán chạy
      </h2>
      {status === "loading" ? (
        <StatisticsLoadingState message="Đang tải..." />
      ) : !products || products.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          Chưa có sản phẩm nào được bán.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted-foreground)]">
                <th className="pb-3 font-medium">Sản phẩm</th>
                <th className="pb-3 font-medium">Loại</th>
                <th className="pb-3 font-medium text-right">Giá</th>
                <th className="pb-3 font-medium text-right">Lượt mua</th>
                <th className="pb-3 font-medium text-right">Doanh thu</th>
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
                    <span className="inline-flex rounded-full bg-[var(--primary)]/10 px-2 py-1 text-xs font-medium text-[var(--primary)]">
                      {product.productType}
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
