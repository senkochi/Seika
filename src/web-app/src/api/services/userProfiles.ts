import { apiClient } from "../client";
import type { UserProfileRequest, UserProfileResponse } from "../types";

export const userProfilesService = {
  getAll: async () => {
    const response = await apiClient.get<UserProfileResponse[]>("/profiles");
    return response.data;
  },

  getAllProfiles: async () => {
    const response = await apiClient.get<UserProfileResponse[]>("/profiles");
    return response.data;
  },

  getByUserId: async (userId: string) => {
    const response = await apiClient.get<UserProfileResponse>(
      `/profiles/${encodeURIComponent(userId)}`,
    );
    return response.data;
  },

  getProfileByUserId: async (userId: string) => {
    const response = await apiClient.get<UserProfileResponse>(
      `/profiles/${encodeURIComponent(userId)}`,
    );
    return response.data;
  },

  create: async (payload: UserProfileRequest) => {
    const response = await apiClient.post<UserProfileResponse>(
      "/profiles",
      payload,
    );
    return response.data;
  },

  createProfile: async (payload: UserProfileRequest) => {
    const response = await apiClient.post<UserProfileResponse>(
      "/profiles",
      payload,
    );
    return response.data;
  },
};
