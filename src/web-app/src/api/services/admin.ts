import { apiClient } from "../client";
import type { EscrowTransaction } from "./marketplace";
import type {
  AdminDashboardStats,
  AdminProductsPage,
  AdminRevenueStats,
  AdminTransactionResponse,
  AdminUsersPage,
  PendingProduct,
  RejectProductRequest,
  SystemConfigEntry,
  UpdateConfigRequest,
  UserAdminResponse,
} from "../types";

export type AdminCollusionFlagStatus =
  | "SUSPICIOUS"
  | "CONFIRMED"
  | "MALICIOUS"
  | "DISMISSED";

export type AdminCollusionFlagFilter = AdminCollusionFlagStatus | "ALL";

export interface AdminCollusionFlag {
  id: string;
  teacherId: string;
  buyerId: string;
  riskScore: number;
  transactionCount: number;
  promoBackedRatio: number;
  noConsumeRatio: number;
  reciprocalRatio: number;
  reviewVelocityAbnormal: boolean;
  lookbackStart: string;
  lookbackEnd: string;
  lastEvaluatedAt: string;
  status: AdminCollusionFlagStatus;
  adminId?: string | null;
  adminReason?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminCollusionFlagsPage {
  content: AdminCollusionFlag[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type CollusionAction =
  | "CONFIRM_COLLUSION"
  | "MARK_MALICIOUS"
  | "DISMISS";
const unwrap = <T>(payload: unknown): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as Record<string, unknown>)
  ) {
    return (payload as { data: T }).data;
  }
  return payload as T;
};

export const adminService = {
  // -------------------------------------------------------------------------
  // Dashboard
  // -------------------------------------------------------------------------
  getDashboardStats: async (): Promise<AdminDashboardStats> => {
    const response = await apiClient.get("/admin/dashboard/stats");
    return unwrap<AdminDashboardStats>(response.data);
  },

  // -------------------------------------------------------------------------
  // User management
  // -------------------------------------------------------------------------
  listUsers: async (
    role?: string,
    page = 0,
    size = 20,
  ): Promise<AdminUsersPage> => {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    params.set("page", String(page));
    params.set("size", String(size));
    const response = await apiClient.get(`/admin/users?${params.toString()}`);
    // Spring Page<T> serializes directly — not wrapped.
    const data = response.data as {
      content: UserAdminResponse[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    };
    return {
      content: data.content ?? [],
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      number: data.number ?? page,
      size: data.size ?? size,
    };
  },

  lockUser: async (userId: string): Promise<UserAdminResponse> => {
    const response = await apiClient.post(`/admin/users/${userId}/lock`);
    return unwrap<UserAdminResponse>(response.data);
  },

  unlockUser: async (userId: string): Promise<UserAdminResponse> => {
    const response = await apiClient.post(`/admin/users/${userId}/unlock`);
    return unwrap<UserAdminResponse>(response.data);
  },

  changeUserRole: async (
    userId: string,
    role: "STUDENT" | "TEACHER",
  ): Promise<UserAdminResponse> => {
    const response = await apiClient.put(`/admin/users/${userId}/role`, {
      role,
    });
    return unwrap<UserAdminResponse>(response.data);
  },

  resetUserPassword: async (userId: string): Promise<{ message: string }> => {
    const response = await apiClient.post(
      `/admin/users/${userId}/reset-password`,
    );
    return unwrap<{ message: string }>(response.data);
  },

  // -------------------------------------------------------------------------
  // Content moderation
  // -------------------------------------------------------------------------
  listPendingProducts: async (
    page = 0,
    size = 20,
  ): Promise<AdminProductsPage> => {
    const response = await apiClient.get(
      `/marketplace/admin/products/pending?page=${page}&size=${size}`,
    );
    const data = response.data as {
      content: PendingProduct[];
      totalElements: number;
      totalPages: number;
      number: number;
      size: number;
    };
    return {
      content: data.content ?? [],
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      number: data.number ?? page,
      size: data.size ?? size,
    };
  },

  approveProduct: async (id: string): Promise<PendingProduct> => {
    const response = await apiClient.post(
      `/marketplace/admin/products/${id}/approve`,
    );
    return unwrap<PendingProduct>(response.data);
  },

  rejectProduct: async (
    id: string,
    request: RejectProductRequest,
  ): Promise<PendingProduct> => {
    const response = await apiClient.post(
      `/marketplace/admin/products/${id}/reject`,
      request,
    );
    return unwrap<PendingProduct>(response.data);
  },

  hideProduct: async (id: string): Promise<PendingProduct> => {
    const response = await apiClient.post(
      `/marketplace/admin/products/${id}/hide`,
    );
    return unwrap<PendingProduct>(response.data);
  },

  // -------------------------------------------------------------------------
  // System config
  // -------------------------------------------------------------------------
  listConfigs: async (): Promise<SystemConfigEntry[]> => {
    const response = await apiClient.get("/wallet/admin/configs");
    const data = unwrap<SystemConfigEntry[]>(response.data);
    return data ?? [];
  },

  updateConfig: async (
    key: string,
    request: UpdateConfigRequest,
  ): Promise<SystemConfigEntry> => {
    const response = await apiClient.put(
      `/wallet/admin/configs/${key}`,
      request,
    );
    return unwrap<SystemConfigEntry>(response.data);
  },

  listMarketplaceConfigs: async (): Promise<SystemConfigEntry[]> => {
    const response = await apiClient.get("/marketplace/admin/configs");
    const data = unwrap<SystemConfigEntry[]>(response.data);
    return data ?? [];
  },

  updateMarketplaceConfig: async (
    key: string,
    request: UpdateConfigRequest,
  ): Promise<SystemConfigEntry> => {
    const response = await apiClient.put(
      `/marketplace/admin/configs/${encodeURIComponent(key)}`,
      request,
    );
    return unwrap<SystemConfigEntry>(response.data);
  },

  // -------------------------------------------------------------------------
  // Marketplace escrow and risk review
  // -------------------------------------------------------------------------
  listEscrows: async (status?: string): Promise<EscrowTransaction[]> => {
    const suffix =
      status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
    const response = await apiClient.get(`/marketplace/admin/escrows${suffix}`);
    const data = unwrap<EscrowTransaction[]>(response.data);
    return data ?? [];
  },
  listPendingEscrowDecisions: async (): Promise<EscrowTransaction[]> => {
    const response = await apiClient.get(
      "/marketplace/admin/orders/pending-decision",
    );
    const data = unwrap<EscrowTransaction[]>(response.data);
    return data ?? [];
  },

  decideEscrow: async (
    orderItemId: string,
    action: "refund" | "force-release" | "no-refund",
    reason: string,
  ): Promise<EscrowTransaction> => {
    const response = await apiClient.post(
      `/marketplace/admin/order-items/${orderItemId}/${action}`,
      { reason },
    );
    return unwrap<EscrowTransaction>(response.data);
  },

  partialRefundEscrow: async (
    orderItemId: string,
    amount: number,
    reason: string,
  ): Promise<EscrowTransaction> => {
    const response = await apiClient.post(
      `/marketplace/admin/order-items/${orderItemId}/partial-refund`,
      { amount, reason },
    );
    return unwrap<EscrowTransaction>(response.data);
  },

  listCollusionFlags: async (
    status?: AdminCollusionFlagFilter,
    page = 0,
    size = 20,
  ): Promise<AdminCollusionFlagsPage> => {
    const params = new URLSearchParams();
    if (status && status !== "ALL") params.set("status", status);
    params.set("page", String(page));
    params.set("size", String(size));
    const response = await apiClient.get(
      `/marketplace/admin/collusion-flags?${params.toString()}`,
    );
    const data = response.data as {
      content?: AdminCollusionFlag[];
      totalElements?: number;
      totalPages?: number;
      number?: number;
      size?: number;
    };
    return {
      content: data.content ?? [],
      totalElements: data.totalElements ?? 0,
      totalPages: data.totalPages ?? 0,
      number: data.number ?? page,
      size: data.size ?? size,
    };
  },

  getCollusionFlag: async (flagId: string): Promise<AdminCollusionFlag> => {
    const response = await apiClient.get(
      `/marketplace/admin/collusion-flags/${flagId}`,
    );
    return unwrap<AdminCollusionFlag>(response.data);
  },

  takeCollusionAction: async (
    flagId: string,
    action: CollusionAction,
    reason: string,
  ): Promise<AdminCollusionFlag> => {
    const response = await apiClient.post(
      `/marketplace/admin/collusion-flags/${flagId}/action`,
      { action, reason },
    );
    return unwrap<AdminCollusionFlag>(response.data);
  },
  // -------------------------------------------------------------------------
  // Revenue and Treasury management
  // -------------------------------------------------------------------------
  getRevenueStats: async (): Promise<AdminRevenueStats> => {
    const response = await apiClient.get("/wallet/admin/revenue-stats");
    return unwrap<AdminRevenueStats>(response.data);
  },

  getSystemTransactions: async (
    type = "ALL",
  ): Promise<AdminTransactionResponse[]> => {
    const response = await apiClient.get(
      `/wallet/admin/transactions?type=${type}`,
    );
    const data = unwrap<AdminTransactionResponse[]>(response.data);
    return data ?? [];
  },
};
