import { apiClient } from "../client";
import type { CardSetCreateRequest, CardSetResponse } from "../types";

export const flashcardsService = {
  create: async (payload: CardSetCreateRequest) => {
    const response = await apiClient.post<CardSetResponse>(
      "/flashcards",
      payload,
    );
    return response.data;
  },

  getAll: async () => {
    const response = await apiClient.get<CardSetResponse[]>("/flashcards");
    return response.data;
  },

  getByAuthorId: async (userId: string) => {
    const response = await apiClient.get<CardSetResponse[]>(
      `/flashcards/author/${encodeURIComponent(userId)}`,
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<CardSetResponse>(
      `/flashcards/${encodeURIComponent(id)}`,
    );
    return response.data;
  },

  search: async (keyword: string) => {
    const response = await apiClient.get<CardSetResponse[]>(
      "/flashcards/search",
      {
        params: { key: keyword },
      },
    );
    return response.data;
  },

  buy: async (id: string) => {
    const response = await apiClient.post<string>("/flashcards/buy", null, {
      params: { id },
    });
    return response.data;
  },
};
