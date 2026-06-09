/**
 * File này chứa các hàm liên quan đến xử lý lỗi từ API. Nó cung cấp một hàm tiện ích để trích xuất thông
 * điệp lỗi từ các lỗi trả về bởi Axios, giúp hiển thị thông báo lỗi rõ ràng hơn cho người dùng.
 */
import { isAxiosError } from "axios";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  detail?: string;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => {
  if (isAxiosError<ApiErrorPayload>(error)) {
    const payload = error.response?.data;
    return payload?.message ?? payload?.error ?? payload?.detail ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};
