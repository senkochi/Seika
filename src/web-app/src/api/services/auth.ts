import { apiClient } from "../client";
import type {
  AuthResponse,
  IntrospectResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  UserInfoResponse,
} from "../types";

export const authService = {
  register: async (payload: RegisterRequest) => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/register",
      payload,
    );
    return response.data;
  },

  login: async (payload: LoginRequest) => {
    const response = await apiClient.post<AuthResponse>("/auth/login", payload);
    return response.data;
  },

  refresh: async (payload: RefreshTokenRequest) => {
    const response = await apiClient.post<AuthResponse>(
      "/auth/refresh",
      payload,
    );
    return response.data;
  },

  introspect: async () => {
    const response = await apiClient.post<IntrospectResponse>(
      "/auth/jwt-introspect",
    );
    return response.data;
  },

  jwtIntrospect: async (token?: string) => {
    const response = await apiClient.post<IntrospectResponse>(
      "/auth/jwt-introspect",
      null,
      token
        ? {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        : undefined,
    );
    return response.data;
  },

  me: async () => {
    const response = await apiClient.get<UserInfoResponse>("/auth/me");
    return response.data;
  },
};
