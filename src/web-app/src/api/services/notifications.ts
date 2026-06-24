import { apiClient } from "../client";
import {
  NotificationResponse,
  MarkAllAsReadResponse,
  UnreadCountResponse,
} from "../types";

export const notificationsService = {
  getAll: async (
    page: number = 0,
    size: number = 10,
  ): Promise<{
    content: NotificationResponse[];
    totalElements: number;
    totalPages: number;
  }> => {
    const response = await apiClient.get(
      `/notifications/me?page=${page}&size=${size}`,
    );
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get("/notifications/me/unread-count");
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<NotificationResponse> => {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  markAllAsRead: async (): Promise<MarkAllAsReadResponse> => {
    const response = await apiClient.patch("/notifications/me/read-all");
    return response.data;
  },
};
