/**
 * File này khởi tạo và cấu hình Instance của Axios để dùng cho toàn bộ ứng dụng.
 */
import axios, { type AxiosInstance } from "axios";

const baseURL =
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
