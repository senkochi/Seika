export type RegisterRole = "STUDENT" | "TEACHER";

export type RegisterRequest = {
  username: string;
  password: string;
  role: RegisterRole;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  profilePictureUrl?: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type RefreshTokenRequest = {
  refreshToken: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  username: string;
  roles: string[];
};

export type UserInfoResponse = {
  id: string;
  username: string;
  roles: string[];
};

export type IntrospectResponse = {
  valid: boolean;
  username?: string;
  roles?: string[];
  userId?: string;
};

export type UserProfileRequest = {
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  profilePictureUrl?: string;
};

export type UserProfileResponse = {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  profilePictureUrl?: string;
};
