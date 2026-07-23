import { BookOpen, HelpCircle, TrendingUp, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation("teacher");

  if (loadingStats) {
    return [
      {
        icon: BookOpen,
        label: t("profile.statFlashcards"),
        value: "...",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      },
      {
        icon: HelpCircle,
        label: t("profile.statQuizzes"),
        value: "...",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      },
      {
        icon: Users,
        label: t("profile.statStudents"),
        value: "...",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        icon: TrendingUp,
        label: t("profile.statExperience"),
        value: "...",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
    ];
  }

  if (statsError) {
    return [
      {
        icon: BookOpen,
        label: t("profile.statFlashcards"),
        value: "–",
        color: "text-purple-400",
        bg: "bg-purple-500/10",
        border: "border-purple-500/20",
      },
      {
        icon: HelpCircle,
        label: t("profile.statQuizzes"),
        value: "–",
        color: "text-blue-400",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
      },
      {
        icon: Users,
        label: t("profile.statStudents"),
        value: "–",
        color: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
      },
      {
        icon: TrendingUp,
        label: t("profile.statExperience"),
        value: "–",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
      },
    ];
  }

  return [
    {
      icon: BookOpen,
      label: t("profile.statFlashcards"),
      value: teacherProfile?.totalFlashcardsCreated ?? 0,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      icon: HelpCircle,
      label: t("profile.statQuizzes"),
      value: teacherProfile?.totalQuizCreated ?? 0,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Users,
      label: t("profile.statStudents"),
      value: teacherProfile?.totalStudentsReached ?? 0,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: TrendingUp,
      label: t("profile.statExperience"),
      value: `${teacherProfile?.exp ?? expFallback} XP`,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];
}
