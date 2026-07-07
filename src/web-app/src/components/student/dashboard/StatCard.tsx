import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color: string;
}

function StatCard({ label, value, trend, trendUp, icon: Icon, color }: StatCardProps) {
  return (
    <div className="relative group bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 hover:border-[var(--primary)] transition-all">
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center`}
          >
            <Icon className="w-6 h-6 text-[var(--foreground)]" />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                trendUp
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {trendUp ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span className="text-sm font-semibold">{trend}</span>
            </div>
          )}
        </div>
        <p className="text-[var(--muted-foreground)] text-sm mb-1">{label}</p>
        <p className="text-3xl font-bold text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}

export default StatCard;