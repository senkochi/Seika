# Spec: Redis Distributed Caching Integration - Phase 2 (Identity & Security Caching)

## 1. Objective

**What we are building and why:**
Tích hợp hệ thống phân tán Redis Cache (Distributed Caching) vào `identity-service` và `api-gateway` (Phase 2) nhằm quản lý **JWT Token Blacklisting (Thu hồi/Khóa Access Token)**, **Logout API (`POST /api/auth/logout`)**, và **Gia tăng độ tin cậy kiểm duyệt xác thực ở API Gateway**.

**Why:**

- Ở Phase 1, chúng ta đã tối ưu hóa các thao tác đọc (Read-Heavy) cho `marketplace`, `flashcard`, `quiz`, và `profile`. Tuy nhiên, về mặt bảo mật (`identity-service`), khi người dùng đăng xuất (`Logout`) hoặc khi Token bị thu hồi/làm mới, JWT Access Token vẫn có hiệu lực cho đến khi hết thời gian `expiration` vì `JwtService` và `AuthenticationFilter` chỉ kiểm tra chữ ký (Signature) và hạn dùng tại chỗ.
- Bằng cách tích hợp Redis vào `identity-service` và `api-gateway`, mỗi khi người dùng gọi `POST /api/auth/logout` hoặc khi refresh token bị thu hồi, `JTI` (JWT ID) của Access Token sẽ được lưu vào Redis dưới namespace `auth:blacklist::<jti>` với TTL chính xác bằng thời gian sống còn lại của token. `api-gateway` (hoặc `/jwt-introspect`) có thể tra cứu Redis siêu nhanh (dưới 1ms) để chặn ngay lập tức các token đã bị thu hồi/đăng xuất trước khi yêu cầu đi vào các microservices nghiệp vụ phía sau.

**User / Persona:**

- **Người dùng cuối (Students/Teachers)**: Đảm bảo tài khoản an toàn tuyệt đối, khi bấm đăng xuất trên thiết bị này hoặc đổi mật khẩu thì Access Token cũ lập tức mất hiệu lực.
- **DevOps / Security Admin**: Kiểm soát tập trung danh sách token bị thu hồi trên Redis với cơ chế tự động xóa (`key expiration`) khi token hết hạn, không gây tốn RAM lâu dài.

---

## 2. Assumptions I'm Making

1. **Redis Cluster / Instance**: Sử dụng chung container `redis:7.4-alpine` đã thiết lập từ Phase 1 (cổng `6379`, mật khẩu từ `${REDIS_PASSWORD}`).
2. **Access Token JTI**: Access Token sinh bởi `JwtService.generateAccessToken()` đã có sẵn claim `jti` (UUID). Chúng ta sử dụng chính `jti` làm khóa nhận diện token trong Redis Blacklist (`auth:blacklist::jti`).
3. **Blacklist TTL Strategy**: TTL của khóa trong blacklist bằng đúng số giây còn lại của token (`expiration_time - now`). Nếu không thể tính toán hoặc token sắp hết hạn, đặt TTL tối đa bằng `access-token-expiration-minutes` (ví dụ: 15-30 phút).
4. **API Gateway Integration**: `api-gateway` sẽ được bổ sung dependency `spring-boot-starter-data-redis-reactive` (hoặc cấu hình Reactive Redis) để `AuthenticationFilter` có thể kiểm tra danh sách đen (`auth:blacklist::jti`) trên Redis trước khi forward request. Nếu `api-gateway` mất kết nối Redis (circuit breaker fallback), Gateway sẽ rơi vào chế độ Fail-Open (chỉ validate chữ ký JWT) hoặc Fail-Closed (tùy cấu hình) với log cảnh báo rõ ràng.
5. **Prod vs Dev Config**: Tuân thủ nghiêm ngặt nguyên tắc `No Fallback in Prod`: các file `-prod.yaml` (`identity-service-prod.yaml`, `api-gateway-prod.yaml`) bắt buộc sử dụng `${REDIS_PASSWORD}` không fallback.

---

## 3. Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 4.0.4 (`identity-service`), Spring Cloud Gateway (`api-gateway`)
- **Caching & Reactive Redis**: `spring-boot-starter-data-redis` (Spring Data Redis / Lettuce), `spring-boot-starter-data-redis-reactive` cho API Gateway.
- **Serialization**: Jackson (`GenericJackson2JsonRedisSerializer` + Allowlist `PolymorphicTypeValidator` cho identity, `StringRedisSerializer` cho blacklist keys).

---

## 4. Commands

```powershell
# Run Unit & Slice Tests cho identity-service & api-gateway
.\src\services\identity-service\mvnw.cmd -f src\services\identity-service\pom.xml test
.\src\api-gateway\mvnw.cmd -f src\api-gateway\pom.xml test

# Rebuild & Restart toàn bộ stack sau khi hoàn thành Phase 2
docker compose up -d --build redis config-service identity-service api-gateway marketplace-service flashcard-service quiz-service profile-service

# Inspect Redis Blacklist Keys qua CLI
docker compose exec redis redis-cli -a seika_redis_secret keys "auth:blacklist::*"
```

---

## 5. Project Structure & Scope

```
src/
├── config-service/src/main/resources/configs/
│   ├── identity-service.yaml / identity-service-prod.yaml → Thêm cấu hình Redis
│   └── api-gateway.yaml / api-gateway-prod.yaml           → Thêm cấu hình Redis
├── api-gateway/
│   ├── pom.xml → Thêm spring-boot-starter-data-redis-reactive
│   └── src/main/java/com/seika/api_gateway/
│       ├── config/RedisConfig.java (Reactive StringRedisTemplate bean)
│       └── filter/AuthenticationFilter.java (Kiểm tra JTI trong auth:blacklist::jti)
└── services/identity-service/
    ├── pom.xml → Thêm spring-boot-starter-data-redis
    ├── src/main/java/com/seika/identity_service/
    │   ├── config/RedisCacheConfig.java
    │   ├── controller/AuthController.java (Thêm POST /logout)
    │   ├── service/TokenBlacklistService.java (Xử lý blacklist JTI với TTL động vào Redis)
    │   ├── service/AuthService.java (Xử lý logic logout & revocation)
    │   └── service/JwtService.java (Cập nhật isValidToken kiểm tra blacklist)
    └── src/test/java/com/seika/identity_service/
        ├── RedisCacheSerializationTest.java
        └── TokenBlacklistServiceTest.java
```

---

## 6. Success Criteria

1. `identity-service` có endpoint `POST /api/auth/logout` nhận header `Authorization: Bearer <token>` và body `RefreshTokenRequest` (tuỳ chọn), lập tức thu hồi Refresh Token trong DB và ghi Access Token JTI vào Redis (`auth:blacklist::jti`) với TTL bằng thời gian sống còn lại của Access Token.
2. `api-gateway` kiểm tra nhanh JTI trong `auth:blacklist::jti` tại `AuthenticationFilter`. Nếu token nằm trong blacklist, Gateway từ chối ngay lập tức (`401 Unauthorized` với thông báo `Access token has been revoked/logged out`).
3. Cấu hình YAML dev vs prod được tách biệt chuẩn xác (`identity-service-prod.yaml` và `api-gateway-prod.yaml` không có fallback password).
4. Toàn bộ test suites của `identity-service` và `api-gateway` chạy thành công 100%.
5. Viết báo cáo tổng kết chi tiết tại `documentation/REDIS_CACHING_PHASE_2_SUMMARY.md`.
