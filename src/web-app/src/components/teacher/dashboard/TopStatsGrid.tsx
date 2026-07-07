import { TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface TeacherTopStat {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
  color: string;
}

interface TopStatsGridProps {
  stats: TeacherTopStat[];
}

function TopStatsGrid({ stats }: TopStatsGridProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}
              >
                <Icon className="w-6 h-6 text-[var(--foreground)]" />
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-400">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-semibold">{stat.trend}</span>
              </div>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm mb-1">
              {stat.label}
            </p>
            <p className="text-3xl font-black text-[var(--foreground)]">
              {stat.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default TopStatsGrid;