import { BookOpen, HelpCircle, TrendingUp, Users } from "lucide-react";
import type { TeacherProfileResponse } from "../../../api";
import type { TeacherStatCard } from "./TeacherAccomplishmentsCard";

/**
 * Build 4 teacher stat cards từ teacherProfile + exp fallback.
 * Loading/error state dùng để hiển thị placeholder value.
 */
export function useTeacherStatCards(
  teacherProfile: TeacherProfileResponse | null,
  expFallback: number,
  loadingStats: boolean,
  statsError: boolean,
): TeacherStatCard[] {
  if (loadingStats) {
    return [
      { icon: BookOpen, label: "Bộ thẻ Flashcard", value: "...", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
      { icon: HelpCircle, label: "Bộ đề trắc nghiệm", value: "...", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
      { icon: Users, label: "Học sinh tiếp cận", value: "...", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
      { icon: TrendingUp, label: "Kinh nghiệm (XP)", value: "...", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    ];
  }

  if (statsError) {
    return [
      { icon: BookOpen, label: "Bộ thẻ Flashcard", value: "–", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
      { icon: HelpCircle, label: "Bộ đề trắc nghiệm", value: "–", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
      { icon: Users, label: "Học sinh tiếp cận", value: "–", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
      { icon: TrendingUp, label: "Kinh nghiệm (XP)", value: "–", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    ];
  }

  return [
    {
      icon: BookOpen,
      label: "Bộ thẻ Flashcard",
      value: teacherProfile?.totalFlashcardsCreated ?? 0,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      icon: HelpCircle,
      label: "Bộ đề trắc nghiệm",
      value: teacherProfile?.totalQuizCreated ?? 0,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Users,
      label: "Học sinh tiếp cận",
      value: teacherProfile?.totalStudentsReached ?? 0,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: TrendingUp,
      label: "Kinh nghiệm (XP)",
      value: `${teacherProfile?.exp ?? expFallback} XP`,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];
}