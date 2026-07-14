import { Award, Star } from "lucide-react";

import type { TeacherRating } from "../../api/services/marketplace";

// Tier styling on the new dashboard palette:
// NEWBIE / SILVER / BRONZE → neutral cream-on-aubergine hairline
// GOLD / ELITE             → gold accent
const TIER_STYLES: Record<string, string> = {
  NEWBIE: "border-white/[0.08] bg-white/[0.04] text-white/65",
  BRONZE: "border-amber-700/30 bg-amber-700/10 text-amber-200",
  SILVER: "border-white/[0.12] bg-white/[0.06] text-white/80",
  GOLD: "border-[#d4a843]/30 bg-[#d4a843]/10 text-[#d4a843]",
  ELITE: "border-[#d4a843]/40 bg-[#d4a843]/15 text-[#f1e4c0]",
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
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-sans-ui ${style}`}
      >
        <Award className="h-3.5 w-3.5" aria-hidden="true" />
        {tier}
      </span>
    );
  }

  return (
    <div
      className={`rounded-lg border p-4 font-sans-ui backdrop-blur-xl ${style}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              Teacher tier
            </p>
            <p className="text-lg font-semibold">{tier}</p>
          </div>
        </div>
        <div className="text-right text-xs opacity-90">
          <p>Fee {pct(rating?.tierFeePercent)}</p>
          <p>{rating?.validReviewCount ?? 0} reviews</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs opacity-90">
        <Star className="h-4 w-4" aria-hidden="true" />
        {(rating?.averageRating ?? 0).toFixed(2)} average rating
      </div>
    </div>
  );
}
