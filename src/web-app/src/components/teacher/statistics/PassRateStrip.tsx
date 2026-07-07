import { TrendingUp } from "lucide-react";

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
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)]">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[var(--primary)]" />
        <div>
          <p className="text-sm text-[var(--muted-foreground)]">
            Tỷ lệ đạt quiz trung bình
          </p>
          <p className="text-xl font-bold text-[var(--foreground)]">
            {passRate.toFixed(1)}%
            <span className="ml-2 text-sm font-medium text-[var(--muted-foreground)]">
              ({formatNumber(totalPassed)} / {formatNumber(totalAttempts)} lượt)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default PassRateStrip;