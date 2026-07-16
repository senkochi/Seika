import { apiClient } from "../client";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "FLASHCARD" | "QUIZ";
  referenceId: string;
  sellerUserId: string;
  status?: string;
  rejectionReason?: string | null;
  teacherDisplayName?: string | null;
  teacherTier?: string | null;
  teacherAverageRating?: number | null;
  teacherValidReviewCount?: number | null;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  userId: string;
  productId: string;
  productType: "FLASHCARD" | "QUIZ" | string;
  referenceId: string;
  orderId: string;
  active: boolean;
  acquiredAt?: string | null;
  consumedAt?: string | null;
  revokedAt?: string | null;
  revocationReason?: string | null;
  product?: Product | null;
}

export interface ReviewResponse {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  orderId: string;
  rating: number;
  comment?: string | null;
  status:
    | "VALID"
    | "PENDING_RISK_REVIEW"
    | "EXCLUDED_WASH"
    | "DELETED_BY_ADMIN"
    | string;
  createdAt?: string | null;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment?: string;
}
export interface TeacherRating {
  teacherId: string;
  averageRating: number;
  validReviewCount: number;
  excludedReviewCount: number;
  tier: "NEWBIE" | "BRONZE" | "SILVER" | "GOLD" | "ELITE" | string;
  tierFeePercent: number;
  consumeRate?: number | null;
  refundRate?: number | null;
  approvalRejectionRate?: number | null;
  updatedAt?: string | null;
}

export interface OrderItemRequest {
  productId: string;
  productType: string;
  referenceId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  sellerUserId: string;
}

export interface MarketplaceOrder {
  id: string;
  userId: string;
  status: "PENDING_PAYMENT" | "PAID" | "FAILED" | string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowTransaction {
  id: string;
  orderId: string;
  orderItemId: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  productType: "FLASHCARD" | "QUIZ" | string;
  grossAmount: number;
  bonusBackedAmount: number;
  rewardBackedAmount: number;
  paidBackedAmount: number;
  earnedPromoBackedAmount: number;
  promoBackedAmount: number;
  tierAtRelease?: string | null;
  tierFeePercent?: number | null;
  escrowFeePercent?: number | null;
  teacherWithdrawableNet?: number | null;
  teacherPromoNet?: number | null;
  platformFeeReal?: number | null;
  platformFeePromoSink?: number | null;
  status: string;
  needsAdminDecision: boolean;
  reviewReason?: string | null;
  releaseAt: string;
  creditRequestedAt?: string | null;
  refundRequestedAt?: string | null;
  releasedAt?: string | null;
  refundedAt?: string | null;
  lastWalletError?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export const marketplaceApi = {
  // Products
  getProducts: () => apiClient.get<Product[]>("/marketplace/products"),
  getProductById: (productId: string) =>
    apiClient.get<Product>(
      `/marketplace/products/${encodeURIComponent(productId)}`,
    ),
  getMyProducts: () =>
    apiClient.get<Product[]>("/marketplace/products/my-products"),

  // Inventory
  getMyInventory: () =>
    apiClient.get<Product[]>("/marketplace/inventory/my-items"),
  getMyInventoryDetails: () =>
    apiClient.get<InventoryItem[]>("/marketplace/inventory/my-items/detail"),

  // Orders
  createOrder: (userId: string, items: OrderItemRequest[]) =>
    apiClient.post<MarketplaceOrder>("/marketplace/orders", { userId, items }),
  getOrder: (orderId: string) =>
    apiClient.get<MarketplaceOrder>(`/marketplace/orders/${orderId}`),

  // Escrow
  getMyEscrows: () =>
    apiClient.get<EscrowTransaction[]>("/marketplace/escrows/me"),
  getSellerEscrows: () =>
    apiClient.get<EscrowTransaction[]>("/marketplace/escrows/seller/me"),
  requestRefund: (escrowId: string) =>
    apiClient.post<EscrowTransaction>(
      `/marketplace/escrows/${escrowId}/refund`,
    ),

  // Reviews
  getProductReviews: (productId: string) =>
    apiClient.get<ReviewResponse[]>(
      `/marketplace/products/${encodeURIComponent(productId)}/reviews`,
    ),
  submitReview: (request: CreateReviewRequest) =>
    apiClient.post<ReviewResponse>("/marketplace/reviews", request),

  // Teacher rating / tier
  getTeacherRating: (teacherId: string) =>
    apiClient.get<TeacherRating>(
      `/marketplace/teachers/${encodeURIComponent(teacherId)}/rating`,
    ),
};
