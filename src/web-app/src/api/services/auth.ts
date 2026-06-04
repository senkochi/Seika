import { apiClient } from "../client";
import type {
  AuthResponse,
  IntrospectResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  UserInfoResponse,
} from "../types";

const register = async (payload: RegisterRequest) => {
  const response = await apiClient.post<AuthResponse>(
    "/auth/register",
    payload,
  );
  return response.data;
};

const login = async (payload: LoginRequest) => {
  const response = await apiClient.post<AuthResponse>("/auth/login", payload);
  return response.data;
};

const refresh = async (payload: RefreshTokenRequest) => {
  const response = await apiClient.post<AuthResponse>("/auth/refresh", payload);
  return response.data;
};

const me = async () => {
  const response = await apiClient.get<UserInfoResponse>("/auth/me");
  return response.data;
};

const jwtIntrospect = async (token: string) => {
  const response = await apiClient.post<IntrospectResponse>(
    "/auth/jwt-introspect",
    null,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return response.data;
};

export const authService = {
  register,
  login,
  refresh,
  me,
  jwtIntrospect,
};
