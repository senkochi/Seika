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
