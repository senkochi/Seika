import type { LucideIcon } from "lucide-react";

interface StatisticsStatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  accent: string;
}

function StatisticsStatCard({
  label,
  value,
  icon: Icon,
  accent,
}: StatisticsStatCardProps) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[var(--muted-foreground)] text-sm font-medium">
            {label}
          </p>
          <p className="mt-3 text-2xl font-bold text-[var(--foreground)] truncate">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${accent}`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default StatisticsStatCard;