import { apiClient } from "../client";
import {
  FlashcardStudentActivity,
  FlashcardStatisticsOverview,
  QuizAttempt,
  QuizStatisticsOverview,
  RevenuePoint,
  StudentPurchase,
  TopProduct,
} from "../types";

export interface TeacherStatisticsOverview {
  quiz: QuizStatisticsOverview | null;
  flashcard: FlashcardStatisticsOverview | null;
  revenue: RevenuePoint[];
}

const unwrap = <T,>(payload: unknown): T => {
  // The backend wraps success responses in ApiResponse<T> but these
  // marketplace/statistics endpoints are returned directly by the controllers.
  // Accept either shape to remain resilient.
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export const statisticsService = {
  /**
   * Pulls the QuizSet overview for the authenticated teacher.
   * Endpoint: GET /api/quiz-sets/my/statistics
   */
  getQuizOverview: async (): Promise<QuizStatisticsOverview> => {
    const response = await apiClient.get("/quiz-sets/my/statistics");
    return unwrap<QuizStatisticsOverview>(response.data);
  },

  /**
   * Pulls the CardSet overview for the authenticated teacher.
   * Endpoint: GET /api/flashcards/my/statistics
   */
  getFlashcardOverview: async (): Promise<FlashcardStatisticsOverview> => {
    const response = await apiClient.get("/flashcards/my/statistics");
    return unwrap<FlashcardStatisticsOverview>(response.data);
  },

  /**
   * Fetches the revenue time-series for the authenticated teacher.
   * @param period either "month" or "day"
   */
  getRevenue: async (period: "month" | "day" = "month"): Promise<RevenuePoint[]> => {
    const response = await apiClient.get(
      `/marketplace/orders/seller/me/revenue?period=${period}`,
    );
    return unwrap<RevenuePoint[]>(response.data) ?? [];
  },

  /**
   * Top products sold by the authenticated teacher.
   * @param productType optional filter ("QUIZ_SET" | "CARD_SET" | "QUIZ" | "FLASHCARD")
   * @param limit defaults to 10
   */
  getTopProducts: async (
    productType?: string,
    limit: number = 10,
  ): Promise<TopProduct[]> => {
    const params = new URLSearchParams();
    if (productType) {
      params.set("productType", productType);
    }
    params.set("limit", String(limit));
    const response = await apiClient.get(
      `/marketplace/orders/seller/me/top-products?${params.toString()}`,
    );
    return unwrap<TopProduct[]>(response.data) ?? [];
  },

  /**
   * Top-selling QuizSets for the authenticated teacher (from quiz-service
   * local product sales mirror).
   */
  getTopQuizSets: async (limit = 5) => {
    const response = await apiClient.get(`/quiz-sets/my/top-selling?limit=${limit}`);
    return unwrap<{
      quizSetId: string;
      title: string;
      totalSold: number;
      totalRevenue: number;
    }[]>(response.data) ?? [];
  },

  /**
   * Top-selling CardSets for the authenticated teacher (from flashcard-service
   * local product sales mirror).
   */
  getTopCardSets: async (limit = 5) => {
    const response = await apiClient.get(`/flashcards/my/top-selling?limit=${limit}`);
    return unwrap<{
      cardSetId: string;
      title: string;
      totalSold: number;
      totalRevenue: number;
    }[]>(response.data) ?? [];
  },

  /**
   * Recent students who purchased from the authenticated teacher.
   */
  getStudents: async (limit = 50): Promise<StudentPurchase[]> => {
    const response = await apiClient.get(
      `/marketplace/orders/seller/me/students?limit=${limit}`,
    );
    return unwrap<StudentPurchase[]>(response.data) ?? [];
  },

  /**
   * Attempts recorded for a single QuizSet (drill-down modal).
   */
  getQuizAttempts: async (quizSetId: string): Promise<QuizAttempt[]> => {
    const response = await apiClient.get(`/quiz-sets/${quizSetId}/attempts`);
    return unwrap<QuizAttempt[]>(response.data) ?? [];
  },

  /**
   * Per-deck student activity (purchase + latest study progress).
   */
  getCardSetStudents: async (
    cardSetId: string,
  ): Promise<FlashcardStudentActivity[]> => {
    const response = await apiClient.get(`/flashcards/${cardSetId}/students`);
    return unwrap<FlashcardStudentActivity[]>(response.data) ?? [];
  },

  /**
   * Convenience: fetch the three overview numbers in parallel.
   */
  fetchOverviewBundle: async (): Promise<TeacherStatisticsOverview> => {
    const [quiz, flashcard, revenue] = await Promise.all([
      statisticsService.getQuizOverview().catch(() => null),
      statisticsService.getFlashcardOverview().catch(() => null),
      statisticsService.getRevenue("month").catch(() => []),
    ]);
    return { quiz, flashcard, revenue };
  },
};
