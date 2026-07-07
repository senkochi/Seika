import { AlertTriangle, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import StatTile from "./StatTile";

export interface TeacherStatCard {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
}

interface TeacherAccomplishmentsCardProps {
  statCards: TeacherStatCard[];
  loadingStats: boolean;
  statsError: boolean;
}

function TeacherAccomplishmentsCard({
  statCards,
  loadingStats,
  statsError,
}: TeacherAccomplishmentsCardProps) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Thành tích Giảng dạy
        </h3>
        {statsError && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Không thể tải thống kê
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat) => (
          <StatTile
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
            color={stat.color}
            bg={stat.bg}
            border={stat.border}
            isLoading={loadingStats}
          />
        ))}
      </div>
    </div>
  );
}

export default TeacherAccomplishmentsCard;