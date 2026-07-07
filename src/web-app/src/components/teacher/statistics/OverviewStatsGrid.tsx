import { DollarSign, Layers, ShoppingCart, Users } from "lucide-react";

import StatisticsStatCard from "./StatisticsStatCard";

interface OverviewStatsGridProps {
  totalRevenue: number;
  totalOrders: number;
  totalStudents: number;
  totalContent: number;
}

const numberFormatter = new Intl.NumberFormat("vi-VN");

export const formatCurrency = (value: number | undefined | null) =>
  `${numberFormatter.format(value ?? 0)} Coins`;

export const formatNumber = (value: number | undefined | null) =>
  numberFormatter.format(value ?? 0);

function OverviewStatsGrid({
  totalRevenue,
  totalOrders,
  totalStudents,
  totalContent,
}: OverviewStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatisticsStatCard
        label="Tổng doanh thu"
        value={formatCurrency(totalRevenue)}
        icon={DollarSign}
        accent="from-amber-400 to-yellow-500"
      />
      <StatisticsStatCard
        label="Tổng lượt mua"
        value={formatNumber(totalOrders)}
        icon={ShoppingCart}
        accent="from-blue-500 to-cyan-600"
      />
      <StatisticsStatCard
        label="Học sinh đã tiếp cận"
        value={formatNumber(totalStudents)}
        icon={Users}
        accent="from-violet-500 to-purple-600"
      />
      <StatisticsStatCard
        label="Sản phẩm đã đăng"
        value={formatNumber(totalContent)}
        icon={Layers}
        accent="from-emerald-500 to-teal-600"
      />
    </div>
  );
}

export default OverviewStatsGrid;