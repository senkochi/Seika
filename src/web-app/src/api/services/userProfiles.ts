import { apiClient } from "../client";
import type { UserProfileRequest, UserProfileResponse } from "../types";

const createProfile = async (payload: UserProfileRequest) => {
  const response = await apiClient.post<UserProfileResponse>(
    "/profiles",
    payload,
  );
  return response.data;
};

const getAllProfiles = async () => {
  const response = await apiClient.get<UserProfileResponse[]>("/profiles");
  return response.data;
};

const getProfileByUserId = async (userId: string) => {
  const response = await apiClient.get<UserProfileResponse>(
    `/profiles/${userId}`,
  );
  return response.data;
};

export const userProfilesService = {
  createProfile,
  getAllProfiles,
  getProfileByUserId,
};
