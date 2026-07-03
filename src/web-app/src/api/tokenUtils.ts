/**
 * File này chứa các utility functions để làm việc với JWT token ở phía client.
 * Decode JWT payload (không cần thư viện bên ngoài) và kiểm tra token đã hết hạn hay chưa.
 */

/**
 * Decode phần payload của JWT token mà không cần thư viện ngoài.
 * JWT có cấu trúc: header.payload.signature (3 phần base64url separated by dots).
 * Hàm này chỉ decode phần payload (phần thứ 2).
 *
 * @returns Parsed payload object, hoặc null nếu decode thất bại.
 */
export const decodeJwtPayload = (
  token: string,
): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    // Base64url → Base64 standard: thay thế ký tự URL-safe về standard
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(base64);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Kiểm tra JWT token đã hết hạn chưa.
 * Sử dụng trường `exp` (expiration time, tính bằng giây Unix epoch) trong payload.
 *
 * @param token - JWT access token string.
 * @param bufferSeconds - Số giây đệm trước khi token thực sự hết hạn (mặc định 30s)
 *   để tránh race-condition do clock skew giữa client và server.
 * @returns true nếu token đã hết hạn hoặc không hợp lệ, false nếu còn hiệu lực.
 */
export const isTokenExpired = (token: string, bufferSeconds = 30): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp - bufferSeconds <= nowInSeconds;
};
