import { Award, Star } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { TeacherRating } from "../../api/services/marketplace";
import { useFormatNumber } from "../../utils/format";

// Tier styling on the new dashboard palette:
// NEWBIE / SILVER / BRONZE → neutral cream-on-aubergine hairline
// GOLD / ELITE             → gold accent
const TIER_STYLES: Record<string, string> = {
  NEWBIE: "bg-white/[0.06] text-white/75",
  BRONZE: "bg-amber-700/20 text-amber-200",
  SILVER: "bg-white/[0.08] text-white/85",
  GOLD: "bg-[#d4a843]/15 text-[#d4a843]",
  ELITE: "bg-[#d4a843]/20 text-[#f1e4c0]",
};

interface TeacherTierBadgeProps {
  rating: TeacherRating | null;
  loading?: boolean;
  compact?: boolean;
}

export default function TeacherTierBadge({
  rating,
  loading = false,
  compact = false,
}: TeacherTierBadgeProps) {
  const { t } = useTranslation("teacher");
  const formatNumber = useFormatNumber();
  const pct = (value: number | null | undefined) =>
    `${formatNumber(Number(value ?? 0))}%`;
  const tier = loading ? t("tierBadge.loading") : (rating?.tier ?? "NEWBIE");
  const style = TIER_STYLES[tier] ?? TIER_STYLES.NEWBIE;

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium font-sans-ui ${style}`}
      >
        <Award className="h-3.5 w-3.5" aria-hidden="true" />
        {tier}
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl border border-white/[0.08] p-4 font-sans-ui backdrop-blur-xl ${style}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" aria-hidden="true" />
          <div>
            <p className="text-xs uppercase tracking-wider opacity-80">
              {t("tierBadge.tierLabel")}
            </p>
            <p className="text-lg font-semibold">{tier}</p>
          </div>
        </div>
        <div className="text-right text-xs opacity-90">
          <p>{t("tierBadge.fee", { pct: pct(rating?.tierFeePercent) })}</p>
          <p>
            {t("tierBadge.reviews", { count: rating?.validReviewCount ?? 0 })}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs opacity-90">
        <Star className="h-4 w-4" aria-hidden="true" />
        {t("tierBadge.avgRating", {
          rating: (rating?.averageRating ?? 0).toFixed(2),
        })}
      </div>
    </div>
  );
}
