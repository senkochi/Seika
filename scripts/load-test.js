import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// =====================================================================
// 1. CẤU HÌNH CUSTOM METRICS (THEO DÕI RIÊNG TRÊN GRAFANA K6)
// =====================================================================
export const errorRate = new Rate("errors");
export const loginLatency = new Trend("login_duration");
export const flashcardLatency = new Trend("flashcard_duration");

// =====================================================================
// 2. CẤU HÌNH KỊCH BẢN LOAD TESTING (SCENARIOS & THRESHOLDS)
// =====================================================================
export const options = {
  // Cấu hình các giai đoạn bơm tải (Ramp-up / Hold / Ramp-down)
  stages: [
    { duration: "30s", target: 20 }, // Giai đoạn 1: Warm-up (Tăng dần lên 20 Virtual Users trong 30s)
    { duration: "1m", target: 50 }, // Giai đoạn 2: Normal Load (Duy trì 50 VUs trong 1 phút)
    { duration: "30s", target: 100 }, // Giai đoạn 3: Spike / Stress (Ép tải lên 100 VUs để tìm điểm nghẽn)
    { duration: "20s", target: 0 }, // Giai đoạn 4: Cool-down (Giảm dần về 0 VUs)
  ],

  // Tiêu chuẩn chấp nhận (Thresholds) - Nếu vượt qua sẽ báo FAIL
  thresholds: {
    http_req_duration: ["p(95)<800", "p(99)<1500"], // 95% request phải xong dưới 800ms, 99% dưới 1500ms
    errors: ["rate<0.05"], // Tỷ lệ lỗi toàn hệ thống phải dưới 5%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";

// =====================================================================
// 3. LUỒNG NGHIỆP VỤ TEST (VIRTUAL USER EXECUTION LOOP)
// =====================================================================
export default function () {
  // -------------------------------------------------------------------
  // TEST CASE 1: Kịch bản Đăng nhập (Test CPU / Auth / Identity DB)
  // -------------------------------------------------------------------
  const loginPayload = JSON.stringify({
    email: "test@test.com",
    password: "wrong_password_for_test", // Cố tình test hiệu năng xử lý của Security & DB Lookup
  });

  const loginHeaders = {
    "Content-Type": "application/json",
  };

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: loginHeaders,
  });

  // Ghi nhận thời gian phản hồi vào custom trend
  loginLatency.add(loginRes.timings.duration);

  // Kiểm tra status code (ở đây dùng mật khẩu sai nên kỳ vọng trả về 400 hoặc 500/401 tuỳ xử lý)
  const loginSuccess = check(loginRes, {
    "Login API phản hồi dưới 1000ms": (r) => r.timings.duration < 1000,
    "Login API trả về HTTP Status hợp lệ": (r) =>
      r.status === 400 ||
      r.status === 401 ||
      r.status === 500 ||
      r.status === 200,
  });

  if (!loginSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(1); // Nghỉ 1 giây giữa các action giống hành vi người dùng thật

  // -------------------------------------------------------------------
  // TEST CASE 2: Kịch bản Xem danh sách Flashcard (Test Read Throughput)
  // -------------------------------------------------------------------
  const flashcardRes = http.get(`${BASE_URL}/api/flashcards`);
  flashcardLatency.add(flashcardRes.timings.duration);

  const flashcardSuccess = check(flashcardRes, {
    "Flashcard API phản hồi dưới 500ms": (r) => r.timings.duration < 500,
    "Flashcard API status không bị 502/503/504 Gateway Error": (r) =>
      r.status < 500,
  });

  if (!flashcardSuccess) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  sleep(2);
}
