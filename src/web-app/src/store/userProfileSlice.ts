/**
 * Redux slice để quản lý trạng thái thông tin profile người dùng.
 * Dữ liệu được tổng hợp từ hai nguồn:
 *  - Identity Service (/auth/me): id, username, roles
 *  - Profile Service (/profiles/{userId}): fullName, dateOfBirth, gender, profilePictureUrl, exp, level, currentStreak, longestStreak
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { authService, getApiErrorMessage, userProfilesService } from "../api";
import type { UserInfoResponse, UserProfileResponse } from "../api";

export type UserProfileState = {
  // From Identity Service
  userId: string | null;
  username: string | null;
  roles: string[];

  // From Profile Service
  profileId: string | null;
  fullName: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  profilePictureUrl: string | null;
  exp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;

  // UI state
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
};

const initialState: UserProfileState = {
  userId: null,
  username: null,
  roles: [],
  profileId: null,
  fullName: null,
  dateOfBirth: null,
  gender: null,
  profilePictureUrl: null,
  exp: 0,
  level: 1,
  currentStreak: 0,
  longestStreak: 0,
  status: "idle",
  error: null,
};

/**
 * Thunk để fetch thông tin đầy đủ của người dùng hiện tại.
 * Bước 1: Gọi GET /auth/me để lấy userId, username, roles.
 * Bước 2: Gọi GET /profiles/{userId} để lấy thông tin profile chi tiết.
 */
export const fetchCurrentUserProfile = createAsyncThunk<
  { identity: UserInfoResponse; profile: UserProfileResponse },
  void,
  { rejectValue: string }
>("userProfile/fetchCurrentUserProfile", async (_, { rejectWithValue }) => {
  try {
    const identity = await authService.me();
    const profile = await userProfilesService.getByUserId(identity.id);
    return { identity, profile };
  } catch (error) {
    return rejectWithValue(
      getApiErrorMessage(error, "Failed to fetch user profile."),
    );
  }
});

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    /**
     * Reset toàn bộ profile state về trạng thái ban đầu (dùng khi logout).
     */
    clearUserProfile: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUserProfile.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchCurrentUserProfile.fulfilled, (state, action) => {
        const { identity, profile } = action.payload;

        // Identity data
        state.userId = identity.id;
        state.username = identity.username;
        state.roles = identity.roles;

        // Profile data
        state.profileId = profile.id;
        state.fullName = profile.fullName;
        state.dateOfBirth = profile.dateOfBirth;
        state.gender = profile.gender;
        state.profilePictureUrl = profile.profilePictureUrl ?? null;
        state.exp = profile.exp ?? 0;
        state.level = profile.level ?? 1;
        state.currentStreak = profile.currentStreak ?? 0;
        state.longestStreak = profile.longestStreak ?? 0;

        state.status = "succeeded";
      })
      .addCase(fetchCurrentUserProfile.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Failed to fetch user profile.";
      });
  },
});

export const { clearUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
