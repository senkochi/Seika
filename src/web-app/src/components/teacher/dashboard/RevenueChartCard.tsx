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
import { SectionCard } from "../../ui/SectionCard";

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
    <SectionCard className="lg:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-sans-ui text-base font-semibold text-cream">
          Doanh thu ({period === "month" ? "theo tháng" : "theo ngày"})
        </h2>
        <div className="inline-flex rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5 font-sans-ui text-xs font-medium">
          {(["month", "day"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onPeriodChange(value)}
              aria-pressed={period === value}
              className={
                period === value
                  ? "rounded-md px-3 py-1 transition-colors bg-[#d4a843]/15 border border-[#d4a843]/30 text-[#d4a843]"
                  : "rounded-md px-3 py-1 transition-colors text-white/55 hover:text-cream"
              }
            >
              {value === "month" ? "Theo tháng" : "Theo ngày"}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex h-[280px] w-full items-center justify-center font-sans-ui text-sm text-white/45">
          Chưa có dữ liệu doanh thu trong khoảng thời gian này.
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <XAxis
                dataKey="period"
                stroke="rgba(255,255,255,0.45)"
                fontSize={12}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.45)"
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) =>
                  value >= 1000 ? `${Math.round(value / 1000)}k` : `${value}`
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#1c0f2e",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#faf6ee",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "rgba(255,255,255,0.55)" }}
                itemStyle={{ color: "#d4a843" }}
                formatter={(value: number) => [
                  formatCurrency(value),
                  "Doanh thu",
                ]}
              />
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="#d4a843"
                strokeWidth={2}
                dot={{ stroke: "#d4a843", fill: "#1c0f2e", r: 3 }}
                activeDot={{ r: 6, fill: "#d4a843" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

export default RevenueChartCard;