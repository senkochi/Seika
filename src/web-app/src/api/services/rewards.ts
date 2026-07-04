import { apiClient } from "../client";
import type { RewardStatusResponse } from "../types";

export const rewardsService = {
  /**
   * Lấy trạng thái nhận thưởng (cooldown, eligibility) của bộ flashcard hoặc quiz
   */
  getRewardStatus: async (type: "FLASHCARD" | "QUIZ", itemId: string) => {
    const response = await apiClient.get<RewardStatusResponse>(
      "/rewards/status",
      {
        params: { type, itemId },
      },
    );
    return response.data;
  },
};
