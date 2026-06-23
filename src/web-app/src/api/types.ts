/**
 * File này khai báo các Interface và Type dùng chung cho toàn bộ tầng API.
 */
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
  exp?: number;
  level?: number;
  currentStreak?: number;
  longestStreak?: number;
};

// Flashcard types
export interface Card {
  frontSide: string;
  backSide: string;
}

export interface CardSetCreateRequest {
  title: string;
  description: string;
  price: number;
  cards: Card[];
}

export interface CardSetResponse {
  id: string;
  title: string;
  description: string;
  price: number;
  cards: Card[];
  authorId: string;
  createdAt?: string;
  updatedAt?: string;
}

// Quiz types
export type QuizType =
  | "MULTIPLE_CHOICE"
  | "REORDER"
  | "MATCHING"
  | "FILL_IN_THE_BLANK";

export interface QuizCreateRequest {
  questionText: string;
  type: QuizType;
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: Record<string, string>;
  correctOrder?: string[];
  acceptedAnswers?: string[];
}

export interface QuizResponse {
  id: string;
  questionText: string;
  type: QuizType;
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
  // MULTIPLE_CHOICE
  options?: string[];
  correctOptionIndex?: number;
  // MATCHING
  matchingPairs?: Record<string, string>;
  // REORDER
  correctOrder?: string[];
  // FILL_IN_THE_BLANK
  acceptedAnswers?: string[];
}

export interface QuizSetCreateRequest {
  title: string;
  description: string;
  questions: QuizCreateRequest[];
}

export interface QuizSetResponse {
  id: string;
  title: string;
  description: string;
  quizzes: QuizResponse[];
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// Teacher Profile types
export interface TeacherProfileResponse {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  profilePictureUrl?: string;
  exp: number;
  level: number;
  totalQuizCreated: number;
  totalFlashcardsCreated: number;
  totalStudentsReached: number;
}
