import { TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import { formatNumber } from "./OverviewStatsGrid";

interface PassRateStripProps {
  passRate: number;
  totalPassed: number;
  totalAttempts: number;
}

function PassRateStrip({
  passRate,
  totalPassed,
  totalAttempts,
}: PassRateStripProps) {
  const { t } = useTranslation("teacher");
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-xl p-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">
            {t("statistics.passRateAvg")}
          </p>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {passRate.toFixed(1)}%
            <span className="ml-2 text-sm font-medium text-[var(--muted-foreground)]">
              {t("statistics.passRateSummary", {
                passed: formatNumber(totalPassed),
                total: formatNumber(totalAttempts),
              })}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PassRateStrip;
