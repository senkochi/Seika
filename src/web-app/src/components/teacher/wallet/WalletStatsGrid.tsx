import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  label: string;
  value: string;
  icon: LucideIcon;
  iconClass: string;
  boxClass: string;
}

function StatTile({ label, value, icon: Icon, iconClass, boxClass }: StatTileProps) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex items-center gap-4 hover:border-[var(--primary)] transition-all">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${boxClass}`}>
        <Icon className={`w-6 h-6 ${iconClass}`} />
      </div>
      <div>
        <p className="text-[var(--muted-foreground)] text-sm">{label}</p>
        <p className="text-xl font-bold text-[var(--foreground)]">{value}</p>
      </div>
    </div>
  );
}

interface WalletStatsGridProps {
  totalEarned: number;
  totalSpent: number;
  currentStreak: number;
}

function WalletStatsGrid({
  totalEarned,
  totalSpent,
  currentStreak,
}: WalletStatsGridProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      <StatTile
        label="Total Earned"
        value={`+${totalEarned.toLocaleString()} Coins`}
        icon={TrendingUp}
        iconClass="text-green-400"
        boxClass="bg-green-500/10 border-green-500/20"
      />
      <StatTile
        label="Total Spent"
        value={`-${totalSpent.toLocaleString()} Coins`}
        icon={TrendingDown}
        iconClass="text-red-400"
        boxClass="bg-red-500/10 border-red-500/20"
      />
      <StatTile
        label="Active Streak"
        value={`${currentStreak} Days`}
        icon={Zap}
        iconClass="text-amber-400"
        boxClass="bg-amber-500/10 border-amber-500/20"
      />
    </div>
  );
}

export default WalletStatsGrid;