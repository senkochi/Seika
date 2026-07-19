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
  quizzesCompleted?: number;
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
  price: number;
  questions: QuizCreateRequest[];
}

export interface QuizSetResponse {
  id: string;
  title: string;
  description: string;
  price: number;
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

// Notification types
export type NotificationType =
  | "SYSTEM"
  | "QUIZ_COMPLETED"
  | "ORDER_COMPLETED"
  | "WALLET_UPDATED";
export type NotificationStatus = "UNREAD" | "READ" | "SENT";
export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS";

export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  title: string;
  content: string;
  eventId?: string;
  createdAt: string;
  readAt?: string;
}

export interface MarkAllAsReadResponse {
  userId: string;
  updatedCount: number;
}

export interface UnreadCountResponse {
  userId: string;
  unreadCount: number;
}

export interface RewardStatusResponse {
  eligible: boolean;
  nextEligibleAt: string | null;
  rewardCount: number;
}

// ---------------------------------------------------------------------------
// Teacher Statistics types (mirror the backend DTOs)
// ---------------------------------------------------------------------------

export interface QuizStatisticsOverview {
  totalQuizSets: number;
  totalAttempts: number;
  totalPassed: number;
  passRate: number;
  totalRevenue: number;
  totalStudents: number;
}

export interface FlashcardStatisticsOverview {
  totalCardSets: number;
  totalPurchases: number;
  totalStudents: number;
  totalRevenue: number;
}

export interface RevenuePoint {
  /** Period label e.g. "2026-07" (monthly) or "2026-07-01" (daily). */
  period: string;
  totalRevenue: number;
  orderCount: number;
}

export interface TopProduct {
  productId: string;
  productType: string;
  productName: string;
  unitPrice: number;
  totalSold: number;
  totalRevenue: number;
}

export interface StudentPurchase {
  userId: string;
  productId: string;
  productType: string;
  productName: string;
  unitPrice: number;
  purchasedAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizSetId: string | null;
  quizId: string | null;
  score: number;
  passed: boolean;
  attemptAt: string;
}

export interface FlashcardStudentActivity {
  userId: string;
  cardSetId: string;
  purchasePrice: number;
  purchasedAt: string;
  lastProgress: number | null;
  completed: boolean;
  lastStudiedAt: string | null;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export interface UserAdminResponse {
  id: string;
  username: string;
  roles: string[];
  enabled: boolean;
}

export interface AdminDashboardStats {
  totalTeachers: number;
  totalStudents: number;
  totalUsers: number;
  totalEnabledUsers: number;
  totalDisabledUsers: number;
  pendingProducts: number;
  totalCoinCirculation: string;
}

export interface PendingProduct {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: "QUIZ" | "FLASHCARD" | string;
  referenceId: string;
  sellerUserId: string;
  status: "PENDING_REVIEW" | "PUBLISHED" | "REJECTED" | "HIDDEN" | string;
  rejectionReason: string | null;
  active: boolean;
  createdAt: string;
}

export interface SystemConfigEntry {
  key: string;
  value: string;
  description: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface UpdateConfigRequest {
  value: string;
}

export interface RejectProductRequest {
  reason: string;
}

export interface AdminUsersPage {
  content: UserAdminResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminProductsPage {
  content: PendingProduct[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminRevenueStats {
  totalTopupCoins: number;
  totalTopupVnd: number;
  totalWithdrawalCoins: number;
  totalWithdrawalVnd: number;
  realRevenueVnd: number;
  paidBackedFeeCoins: number;
  promoSinkCoins: number;
  cashOutLiabilityVnd: number;
  withdrawableCoinCirculation: number;
  nonWithdrawableCoinCirculation: number;
  netRevenueVnd: number;
  totalCoinCirculation: number;
  potentialLiabilityVnd: number;
  guaranteedProfitVnd: number;
  currentTopupRate: number;
  currentWithdrawalRate: number;
}

export interface AdminTransactionResponse {
  id: string;
  userId: string;
  walletId: string;
  type: string;
  flowDirection?: "INFLOW" | "OUTFLOW" | "NEUTRAL";
  amount: number;
  amountVnd: number;
  description: string;
  createdAt: string;
}
