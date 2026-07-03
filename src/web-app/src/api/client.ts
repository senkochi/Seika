/**
 * File này khởi tạo và cấu hình Instance của Axios để dùng cho toàn bộ ứng dụng.
 * Bao gồm response interceptor để tự động refresh token khi nhận lỗi 401.
 */
import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { AuthResponse } from "./types";

export const baseURL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";

// Tạo một instance của Axios với cấu hình cơ bản: baseURL và timeout.
export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 15000,
});

// Hàm để thiết lập token cho các yêu cầu API. Nếu token tồn tại, nó sẽ được thêm vào header Authorization dưới dạng Bearer token. Nếu token là null, header Authorization sẽ bị xóa bỏ.
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }
  delete apiClient.defaults.headers.common.Authorization; // Nếu token là null, xóa header Authorization để đảm bảo rằng các yêu cầu tiếp theo sẽ không gửi token cũ.
};

// ─── Auto-refresh token interceptor ───────────────────────────────────────────
// Khi nhận 401, interceptor sẽ thử refresh access token bằng refresh token.
// Nếu thành công → retry request gốc. Nếu thất bại → logout & redirect về login.
// Sử dụng hàng đợi (queue) để xử lý nhiều request đồng thời khi đang refresh.

const AUTH_STORAGE_KEY = "seika.auth";

/** Cờ đánh dấu đang trong quá trình refresh token */
let isRefreshing = false;

/** Hàng đợi các request bị chờ khi đang refresh */
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Xử lý hàng đợi sau khi refresh token xong.
 * Nếu có token mới → resolve tất cả request đang chờ với token mới.
 * Nếu có lỗi → reject tất cả.
 */
const processQueue = (error: unknown, token: string | null = null) => {
  for (const { resolve, reject } of failedQueue) {
    if (token) resolve(token);
    else reject(error);
  }
  failedQueue = [];
};

// ─── Store injection ──────────────────────────────────────────────────────────
// Sử dụng pattern inject store để tránh circular dependency giữa client.ts ↔ authSlice.ts.
// Store sẽ được inject từ main.tsx sau khi app khởi tạo.

type StoreDispatch = (action: unknown) => void;

let dispatchRef: StoreDispatch | null = null;
let logoutActionCreator: (() => unknown) | null = null;
let setCredentialsActionCreator: ((payload: any) => any) | null = null;

/**
 * Inject Redux store dispatch và action creators vào module này.
 * Gọi hàm này từ main.tsx sau khi store đã được tạo, để tránh circular import.
 */
export const setupAuthInterceptor = (injection: {
  dispatch: StoreDispatch;
  logout: () => unknown;
  setCredentials: (payload: any) => any;
}) => {
  dispatchRef = injection.dispatch;
  logoutActionCreator = injection.logout;
  setCredentialsActionCreator = injection.setCredentials;
};

/**
 * Đọc auth state trực tiếp từ storage (localStorage hoặc sessionStorage).
 * Không phụ thuộc vào Redux store → tránh circular dependency.
 */
const getStoredRefreshToken = (): string | null => {
  const raw =
    window.localStorage.getItem(AUTH_STORAGE_KEY) ??
    window.sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw)?.refreshToken ?? null;
  } catch {
    return null;
  }
};

/**
 * Xác định storage nào đang được sử dụng để lưu auth (localStorage hoặc sessionStorage)
 * và cập nhật dữ liệu mới vào đó.
 */
const updateStoredAuth = (newAuth: Record<string, unknown>) => {
  const storages = [window.localStorage, window.sessionStorage] as const;
  for (const storage of storages) {
    const raw = storage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      try {
        const existing = JSON.parse(raw);
        storage.setItem(
          AUTH_STORAGE_KEY,
          JSON.stringify({ ...existing, ...newAuth }),
        );
      } catch {
        /* ignore malformed JSON */
      }
      return;
    }
  }
};

/**
 * Buộc đăng xuất: xóa storage, xóa axios header, dispatch logout action,
 * và redirect về trang login.
 */
const forceLogout = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  setAuthToken(null);

  if (dispatchRef && logoutActionCreator) {
    dispatchRef(logoutActionCreator());
  }

  // Redirect về login nếu không đang ở trang auth
  const { pathname } = window.location;
  if (
    !pathname.startsWith("/auth/") &&
    pathname !== "/home" &&
    pathname !== "/"
  ) {
    window.location.href = "/auth/login";
  }
};

// ─── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Chỉ xử lý lỗi 401 và chưa retry
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Lấy refresh token từ storage
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      // Không có refresh token → force logout
      forceLogout();
      return Promise.reject(error);
    }

    // Nếu đang refresh → xếp request vào hàng đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          },
          reject: (err: unknown) => {
            reject(err);
          },
        });
      });
    }

    // Bắt đầu refresh
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Gọi refresh endpoint trực tiếp bằng axios mới (không qua apiClient)
      // để tránh bị interceptor bắt lại nếu refresh cũng trả 401.
      const response = await axios.post<AuthResponse>(
        `${baseURL}/auth/refresh`,
        { refreshToken },
      );

      const newAuth = response.data;
      const newAccessToken = newAuth.accessToken;

      // Cập nhật token trong storage
      updateStoredAuth({
        accessToken: newAuth.accessToken,
        refreshToken: newAuth.refreshToken,
        tokenType: newAuth.tokenType,
        username: newAuth.username,
        roles: newAuth.roles ?? [],
      });

      // Cập nhật header mặc định của Axios
      setAuthToken(newAccessToken);

      // Cập nhật Redux store
      if (dispatchRef && setCredentialsActionCreator) {
        dispatchRef(
          setCredentialsActionCreator({
            accessToken: newAuth.accessToken,
            refreshToken: newAuth.refreshToken,
            tokenType: newAuth.tokenType,
            username: newAuth.username,
            roles: newAuth.roles ?? [],
          }),
        );
      }

      // Xử lý hàng đợi với token mới
      processQueue(null, newAccessToken);

      // Retry request gốc
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh thất bại → force logout
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
