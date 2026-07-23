import { DollarSign, Layers, ShoppingCart, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import StatisticsStatCard from "./StatisticsStatCard";
import { useFormatNumber } from "../../../utils/format";

interface OverviewStatsGridProps {
  totalRevenue: number;
  totalOrders: number;
  totalStudents: number;
  totalContent: number;
}

export const useOverviewFormatters = () => {
  const { t } = useTranslation("teacher");
  const formatNum = useFormatNumber();
  return {
    formatCurrency: (value: number | undefined | null) =>
      t("statistics.coinsUnit", { amount: formatNum(value ?? 0) }),
    formatNumber: (value: number | undefined | null) => formatNum(value ?? 0),
  };
};

export const formatCurrency = (
  value: number | undefined | null,
  formatNum = (v: number) => new Intl.NumberFormat().format(v),
) => `${formatNum(value ?? 0)} Coins`;

export const formatNumber = (
  value: number | undefined | null,
  formatNum = (v: number) => new Intl.NumberFormat().format(v),
) => formatNum(value ?? 0);

function OverviewStatsGrid({
  totalRevenue,
  totalOrders,
  totalStudents,
  totalContent,
}: OverviewStatsGridProps) {
  const { t } = useTranslation("teacher");
  const { formatCurrency: fmtCurr, formatNumber: fmtNum } =
    useOverviewFormatters();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatisticsStatCard
        label={t("statistics.totalRevenue")}
        value={fmtCurr(totalRevenue)}
        icon={DollarSign}
        accent="from-amber-400 to-yellow-500"
      />
      <StatisticsStatCard
        label={t("statistics.totalOrders")}
        value={fmtNum(totalOrders)}
        icon={ShoppingCart}
        accent="from-blue-500 to-cyan-600"
      />
      <StatisticsStatCard
        label={t("statistics.studentsReached")}
        value={fmtNum(totalStudents)}
        icon={Users}
        accent="from-violet-500 to-purple-600"
      />
      <StatisticsStatCard
        label={t("statistics.productsPublished")}
        value={fmtNum(totalContent)}
        icon={Layers}
        accent="from-emerald-500 to-teal-600"
      />
    </div>
  );
}

export default OverviewStatsGrid;
