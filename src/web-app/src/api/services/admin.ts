import { apiClient } from "../client";
import type {
  AdminDashboardStats,
  AdminProductsPage,
  AdminUsersPage,
  PendingProduct,
  RejectProductRequest,
  SystemConfigEntry,
  UpdateConfigRequest,
  UserAdminResponse,
} from "../types";

const unwrap = <T,>(payload: unknown): T => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
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
    const response = await apiClient.put(`/admin/users/${userId}/role`, { role });
    return unwrap<UserAdminResponse>(response.data);
  },

  resetUserPassword: async (userId: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/admin/users/${userId}/reset-password`);
    return unwrap<{ message: string }>(response.data);
  },

  // -------------------------------------------------------------------------
  // Content moderation
  // -------------------------------------------------------------------------
  listPendingProducts: async (page = 0, size = 20): Promise<AdminProductsPage> => {
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
    const response = await apiClient.post(`/marketplace/admin/products/${id}/approve`);
    return unwrap<PendingProduct>(response.data);
  },

  rejectProduct: async (id: string, request: RejectProductRequest): Promise<PendingProduct> => {
    const response = await apiClient.post(
      `/marketplace/admin/products/${id}/reject`,
      request,
    );
    return unwrap<PendingProduct>(response.data);
  },

  hideProduct: async (id: string): Promise<PendingProduct> => {
    const response = await apiClient.post(`/marketplace/admin/products/${id}/hide`);
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
    const response = await apiClient.put(`/wallet/admin/configs/${key}`, request);
    return unwrap<SystemConfigEntry>(response.data);
  },
};