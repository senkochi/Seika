import { Zap, Target, Sword, Swords } from "lucide-react";

/** Stats có trend (hiển thị top). */
export const topStatsConfig = [
  {
    label: "Total XP",
    trend: "+12%",
    trendUp: true,
    icon: Zap,
    color: "from-amber-400 to-yellow-500",
  },
  {
    label: "Quizzes Completed",
    trend: "+1",
    trendUp: true,
    icon: Target,
    color: "from-purple-500 to-violet-600",
  },
] as const;

/** Stats đơn giản (hiển thị quick stats). */
export const quickStatsConfig = [
  {
    label: "Current Streak",
    icon: Sword,
    color: "text-blue-400",
  },
  {
    label: "Longest Streak",
    icon: Swords,
    color: "text-green-400",
  },
] as const;