import { apiClient } from "../client";
import type { QuizCreateRequest, QuizResponse } from "../types";

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export const quizzesService = {
  create: async (payload: QuizCreateRequest) => {
    const response = await apiClient.post<ApiResponse<QuizResponse>>(
      "/quiz",
      payload,
    );
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get<ApiResponse<QuizResponse[]>>("/quiz");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<ApiResponse<QuizResponse>>(
      `/quiz/${encodeURIComponent(id)}`,
    );
    return response.data;
  },
};
