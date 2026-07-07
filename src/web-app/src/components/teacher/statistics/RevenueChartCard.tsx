import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RevenuePoint } from "../../../api/types";
import { formatCurrency } from "./OverviewStatsGrid";

interface RevenueChartCardProps {
  period: "month" | "day";
  data: RevenuePoint[];
}

function RevenueChartCard({ period, data }: RevenueChartCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
      <h2 className="mb-4 text-lg font-semibold text-[var(--foreground)]">
        Doanh thu ({period === "month" ? "theo tháng" : "theo ngày"})
      </h2>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-[var(--muted-foreground)]">
          Chưa có dữ liệu doanh thu trong khoảng thời gian này.
        </p>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                stroke="var(--muted-foreground)"
                fontSize={12}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickFormatter={(value) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
                }
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Doanh thu",
                ]}
              />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ stroke: "var(--primary)", fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default RevenueChartCard;