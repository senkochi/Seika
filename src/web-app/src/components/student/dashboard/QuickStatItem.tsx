import type { LucideIcon } from "lucide-react";

interface QuickStatItemProps {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
}

function QuickStatItem({ label, value, icon: Icon, color }: QuickStatItemProps) {
  return (
    <div className="flex-1 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6 flex items-center hover:border-[var(--primary)] transition-all">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-[var(--card)] rounded-xl flex items-center justify-center">
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
        <div>
          <p className="text-[var(--muted-foreground)] text-sm">{label}</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default QuickStatItem;