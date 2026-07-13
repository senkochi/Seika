import { Award, Star } from "lucide-react";

import type { TeacherRating } from "../../api/services/marketplace";

const TIER_STYLES: Record<string, string> = {
  NEWBIE: "border-slate-400/25 bg-slate-400/10 text-slate-200",
  BRONZE: "border-amber-700/30 bg-amber-700/15 text-amber-200",
  SILVER: "border-zinc-300/30 bg-zinc-300/15 text-zinc-100",
  GOLD: "border-yellow-300/35 bg-yellow-300/15 text-yellow-100",
  ELITE: "border-emerald-300/35 bg-emerald-300/15 text-emerald-100",
};

interface TeacherTierBadgeProps {
  rating: TeacherRating | null;
  loading?: boolean;
  compact?: boolean;
}

function pct(value: number | null | undefined) {
  return `${Number(value ?? 0).toLocaleString("vi-VN")}%`;
}

export default function TeacherTierBadge({
  rating,
  loading = false,
  compact = false,
}: TeacherTierBadgeProps) {
  const tier = loading ? "..." : (rating?.tier ?? "NEWBIE");
  const style = TIER_STYLES[tier] ?? TIER_STYLES.NEWBIE;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-black ${style}`}
      >
        <Award className="h-3.5 w-3.5" />
        {tier}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${style}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <div>
            <p className="text-xs font-semibold uppercase opacity-80">
              Teacher tier
            </p>
            <p className="text-lg font-black">{tier}</p>
          </div>
        </div>
        <div className="text-right text-xs font-semibold opacity-90">
          <p>Fee {pct(rating?.tierFeePercent)}</p>
          <p>{rating?.validReviewCount ?? 0} reviews</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs font-semibold opacity-90">
        <Star className="h-4 w-4" />
        {(rating?.averageRating ?? 0).toFixed(2)} average rating
      </div>
    </div>
  );
}
