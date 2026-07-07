import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: string;
  bg: string;
  border: string;
  isLoading: boolean;
}

function StatTile({
  icon: Icon,
  label,
  value,
  color,
  bg,
  border,
  isLoading,
}: StatTileProps) {
  return (
    <div
      className={`p-5 ${bg} border ${border} rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02]`}
    >
      <div className={`p-2.5 rounded-xl bg-black/20`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <p className={`text-2xl font-black ${color}`}>
          {isLoading ? (
            <span className="inline-block w-8 h-7 bg-white/10 rounded animate-pulse" />
          ) : (
            value
          )}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-tight">
          {label}
        </p>
      </div>
    </div>
  );
}

export default StatTile;