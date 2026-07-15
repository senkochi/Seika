import type { LucideIcon } from "lucide-react";

import { StatCard } from "../../ui/StatCard";
import type { Variant } from "../../ui/IconChip";

export interface TeacherTopStat {
  label: string;
  value: string;
  trend?: string;
  icon: LucideIcon;
  variant: Variant;
}

interface TopStatsGridProps {
  stats: TeacherTopStat[];
}

/**
 * Grid of KPI StatCards. Replaces the previous 3-up colorful gradient tiles.
 */
function TopStatsGrid({ stats }: TopStatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={<Icon className="w-4 h-4" aria-hidden="true" />}
            iconVariant={stat.variant}
            hint={stat.trend}
          />
        );
      })}
    </div>
  );
}

export default TopStatsGrid;