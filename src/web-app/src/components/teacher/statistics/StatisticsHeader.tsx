import { BarChart3, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

export type StatisticsPeriod = "month" | "day";

interface StatisticsHeaderProps {
  period: StatisticsPeriod;
  onPeriodChange: (period: StatisticsPeriod) => void;
  onReload: () => void;
}

function StatisticsHeader({
  period,
  onPeriodChange,
  onReload,
}: StatisticsHeaderProps) {
  const { t } = useTranslation("teacher");
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold text-[var(--foreground)]">
          <BarChart3 className="h-7 w-7 text-[var(--primary)]" />
          {t("statistics.headerTitle")}
        </h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          {t("statistics.headerDesc")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-md p-1 text-sm">
          {(["month", "day"] as const).map((value) => (
            <button
              key={value}
              onClick={() => onPeriodChange(value)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                period === value
                  ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              {value === "month"
                ? t("statistics.byMonth")
                : t("statistics.byDay")}
            </button>
          ))}
        </div>
        <button
          onClick={onReload}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)]"
        >
          <RefreshCcw className="h-4 w-4" /> {t("statistics.refresh")}
        </button>
      </div>
    </div>
  );
}

export default StatisticsHeader;
