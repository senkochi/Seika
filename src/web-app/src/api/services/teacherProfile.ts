import { apiClient } from "../client";
import type { TeacherProfileResponse } from "../types";

export const teacherProfileService = {
  /**
   * GET /api/profiles/teacher/me
   * Lấy teacher profile của giáo viên hiện tại (dùng cho TeacherProfile page).
   */
  getMyProfile: async (): Promise<TeacherProfileResponse> => {
    const response = await apiClient.get<TeacherProfileResponse>(
      "/profiles/teacher/me",
    );
    return response.data;
  },

  /**
   * GET /api/profiles/teacher/{userId}
   * Lấy teacher profile theo userId (public, dùng cho marketplace listing).
   */
  getByUserId: async (userId: string): Promise<TeacherProfileResponse> => {
    const response = await apiClient.get<TeacherProfileResponse>(
      `/profiles/teacher/${encodeURIComponent(userId)}`,
    );
    return response.data;
  },
};
