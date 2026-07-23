import { useMemo } from "react";

export interface FlashcardOverview {
  totalRevenue?: number;
  totalStudents?: number;
  totalPurchases?: number;
  totalCardSets?: number;
}
export interface QuizOverview {
  totalRevenue?: number;
  totalStudents?: number;
  passRate: number;
  totalPassed: number;
  totalAttempts: number;
  totalQuizSets?: number;
}
export interface RevenuePoint {
  period: string;
  totalRevenue?: number;
  orderCount?: number;
}

export interface StatisticsTotals {
  totalRevenue: number;
  totalOrders: number;
  totalFlashcardSales: number;
  totalStudents: number;
  totalContent: number;
}

export function useStatisticsOverview(
  revenue: RevenuePoint[],
  flashcard: FlashcardOverview | null | undefined,
  quiz: QuizOverview | null | undefined,
  students?: Array<{ userId?: string }> | null,
): StatisticsTotals {
  const revenueTotals = useMemo(() => {
    const revenueTotal = revenue.reduce(
      (acc, p) => acc + (p.totalRevenue || 0),
      0,
    );
    const ordersTotal = revenue.reduce(
      (acc, p) => acc + (p.orderCount || 0),
      0,
    );
    return { revenueTotal, ordersTotal };
  }, [revenue]);

  const marketplaceStudentsCount = useMemo(() => {
    if (!students || !Array.isArray(students)) return 0;
    const uniqueIds = new Set(students.map((s) => s.userId).filter(Boolean));
    return uniqueIds.size;
  }, [students]);

  const flashcardRevenue = flashcard?.totalRevenue ?? 0;
  const quizRevenue = quiz?.totalRevenue ?? 0;
  const totalRevenue =
    revenue.length > 0
      ? revenueTotals.revenueTotal
      : flashcardRevenue + quizRevenue;
  const totalOrders =
    revenue.length > 0
      ? revenueTotals.ordersTotal
      : (flashcard?.totalPurchases ?? 0);
  const totalFlashcardSales = flashcard?.totalPurchases ?? 0;
  const totalStudents = Math.max(
    marketplaceStudentsCount,
    flashcard?.totalStudents ?? 0,
    quiz?.totalStudents ?? 0,
  );
  const totalContent =
    (quiz?.totalQuizSets ?? 0) + (flashcard?.totalCardSets ?? 0);

  return {
    totalRevenue,
    totalOrders,
    totalFlashcardSales,
    totalStudents,
    totalContent,
  };
}
