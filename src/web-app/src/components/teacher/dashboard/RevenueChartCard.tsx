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

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | undefined | null) =>
  currencyFormatter.format(value ?? 0);

interface RevenueChartCardProps {
  chartData: RevenuePoint[];
  period: "month" | "day";
  onPeriodChange: (period: "month" | "day") => void;
}

function RevenueChartCard({
  chartData,
  period,
  onPeriodChange,
}: RevenueChartCardProps) {
  return (
    <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          Doanh thu ({period === "month" ? "theo tháng" : "theo ngày"})
        </h2>
        <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--background)] p-1 text-xs font-medium">
          {(["month", "day"] as const).map((value) => (
            <button
              key={value}
              onClick={() => onPeriodChange(value)}
              className={`rounded-lg px-3 py-1 transition-colors ${
                period === value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {value === "month" ? "Theo tháng" : "Theo ngày"}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[280px] w-full items-center justify-center text-sm text-[var(--muted-foreground)]">
          Chưa có dữ liệu doanh thu trong khoảng thời gian này.
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
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
                  value >= 1000
                    ? `${Math.round(value / 1000)}k`
                    : `${value}`
                }
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  borderRadius: "0.75rem",
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
                activeDot={{ r: 6, fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default RevenueChartCard;