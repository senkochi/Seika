import { apiClient } from "../client";
import type {
  QuizCreateRequest,
  QuizResponse,
  QuizSetCreateRequest,
  QuizSetResponse,
} from "../types";

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export const quizzesService = {
  /**
   * Lấy toàn bộ quiz (dùng cho học sinh, public)
   */
  getAll: async () => {
    const response = await apiClient.get<ApiResponse<QuizResponse[]>>("/quiz");
    return response.data;
  },

  /**
   * Lấy quiz do giáo viên hiện tại tạo (dùng cho ContentManager)
   */
  getMyQuizzes: async () => {
    const response =
      await apiClient.get<ApiResponse<QuizResponse[]>>("/quiz/my");
    return response.data;
  },

  /**
   * Lấy quiz theo ID
   */
  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<QuizResponse>>(
      `/quiz/${encodeURIComponent(id)}`,
    );
    return response.data;
  },

  /**
   * Tạo quiz mới (giáo viên)
   */
  create: async (payload: QuizCreateRequest) => {
    const response = await apiClient.post<ApiResponse<QuizResponse>>(
      "/quiz",
      payload,
    );
    return response.data;
  },

  /**
   * Xóa quiz (giáo viên – chỉ xóa được của mình)
   */
  deleteQuiz: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/quiz/${encodeURIComponent(id)}`,
    );
    return response.data;
  },

  /**
   * Tạo Quiz Set mới (giáo viên)
   */
  createQuizSet: async (payload: QuizSetCreateRequest) => {
    const response = await apiClient.post<ApiResponse<QuizSetResponse>>(
      "/quiz-sets",
      payload,
    );
    return response.data;
  },

  /**
   * Lấy danh sách Quiz Set do giáo viên hiện tại tạo
   */
  getMyQuizSets: async () => {
    const response =
      await apiClient.get<ApiResponse<QuizSetResponse[]>>("/quiz-sets/my");
    return response.data;
  },

  /**
   * Lấy chi tiết Quiz Set
   */
  getQuizSetById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<QuizSetResponse>>(
      `/quiz-sets/${encodeURIComponent(id)}`,
    );
    return response.data;
  },

  updateQuizSet: async (id: string, payload: QuizSetCreateRequest) => {
    const response = await apiClient.put<ApiResponse<QuizSetResponse>>(
      `/quiz-sets/${encodeURIComponent(id)}`,
      payload,
    );
    return response.data;
  },

  /**
   * Xóa Quiz Set
   */
  deleteQuizSet: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(
      `/quiz-sets/${encodeURIComponent(id)}`,
    );
    return response.data;
  },

  /**
   * Nộp điểm bài quiz
   */
  submitQuiz: async (id: string, score: number) => {
    const response = await apiClient.post<ApiResponse<void>>(
      `/quiz/${encodeURIComponent(id)}/submit`,
      { score },
    );
    return response.data;
  },
};
