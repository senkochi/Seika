import { Zap, Target, Sword, Swords, type LucideIcon } from "lucide-react";
import type { Variant } from "../../ui/IconChip";

/** Stats có trend (hiển thị top). */
export type TopStatConfig = {
  label: string;
  trend: string;
  trendUp: boolean;
  icon: LucideIcon;
  iconVariant: Variant;
};

export const topStatsConfig: readonly TopStatConfig[] = [
  {
    label: "Total XP",
    trend: "+12%",
    trendUp: true,
    icon: Zap,
    iconVariant: "gold",
  },
  {
    label: "Quizzes Completed",
    trend: "+1",
    trendUp: true,
    icon: Target,
    iconVariant: "info",
  },
];

/** Stats đơn giản (hiển thị quick stats). */
export type QuickStatConfig = {
  label: string;
  icon: LucideIcon;
  iconVariant: Variant;
};

export const quickStatsConfig: readonly QuickStatConfig[] = [
  {
    label: "Current Streak",
    icon: Sword,
    iconVariant: "success",
  },
  {
    label: "Longest Streak",
    icon: Swords,
    iconVariant: "warning",
  },
];