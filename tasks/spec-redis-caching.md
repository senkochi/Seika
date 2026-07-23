# Spec: Redis Distributed Caching Integration (Phase 1)

## 1. Objective

**What we are building and why:**
Tích hợp hệ thống phân tán Redis Cache (Distributed Caching) cho 4 microservices chịu tải đọc lớn nhất trong hệ thống Seika: `marketplace-service`, `flashcard-service`, `quiz-service`, và `profile-service` theo mô hình **Cache-Aside** kết hợp **Event-Driven / Write-Through Eviction**.

**Why:**

- Hiện tại các thao tác truy vấn đọc (catalog học liệu, chi tiết flashcard deck, quiz set, user profile) đi trực tiếp xuống PostgreSQL và MongoDB, gây tải cao và độ trễ phản hồi API chưa tối ưu.
- Việc áp dụng Redis giúp giảm 80-90% tải truy vấn trực tiếp xuống DB, rút ngắn độ trễ API xuống dưới 5ms, đồng thời duy trì tính nhất quán dữ liệu (Data Consistency) thông qua tự động xóa/cập nhật cache ngay khi có thao tác write hoặc event RabbitMQ.

**User / Persona:**
Người dùng cuối (Students/Teachers) nhận được tốc độ phản hồi trang web siêu nhanh; System Admin / DevOps có hệ thống an toàn, bảo mật, giới hạn RAM kiểm soát chặt chẽ bằng chính sách LRU eviction.

---

## 2. Assumptions I'm Making

1. **Infrastructure**: Chúng ta sử dụng image `redis:7.4-alpine` cho cả môi trường dev (`docker-compose.yml`) và prod (`docker-compose.prod.yml`).
2. **Security**: Môi trường Dev sử dụng mật khẩu mặc định `seika_redis_secret`. Môi trường Prod bắt buộc biến môi trường `${REDIS_PASSWORD?REDIS_PASSWORD is required in production}`, không expose port `6379` ra host.
3. **Scope Phase 1**: Tập trung vào 4 dịch vụ (`marketplace`, `flashcard`, `quiz`, `profile`). `identity-service` (JWT token blacklist) được để dành cho Phase 2.
4. **Serialization Safety & DTO Standard**:
   - Tuyệt đối **không cache trực tiếp JPA Entity hay Mongo Document**.
   - Tại `marketplace-service`, do `Product` là JPA entity, chúng ta sẽ tạo DTO `ProductResponse` (`com.seika.marketplace_service.dto.ProductResponse`) để trả về từ service/cache helper và lưu trong Redis. `ProductController` cũng sẽ được đồng bộ chữ ký để trả về `ProductResponse`.
   - Sử dụng `GenericJackson2JsonRedisSerializer` kết hợp với allowlist khắt khe `PolymorphicTypeValidator` (`com.seika.`, `java.util.`, `java.time.`).
   - **Bắt buộc kiểm thử deserialize cụ thể**: Viết `RedisCacheSerializationTest.java` tại từng service để xác nhận khả năng serialize & deserialize chính xác (round-trip) cho từng cached DTO (`ProductResponse`, `CardSetDTO`, `QuizSetResponse`, `UserProfileResponse`).

---

## 3. Tech Stack

- **Language**: Java 21
- **Framework**: Spring Boot 4.0.4, Spring Cloud 2025.1.1
- **Caching & Messaging**: Spring Data Redis (Lettuce), RabbitMQ 4.3
- **Serialization**: Jackson (`GenericJackson2JsonRedisSerializer` + `JavaTimeModule` + `PolymorphicTypeValidator`)
- **Database**: PostgreSQL 16 (`marketplace-db`, `profile-db`), MongoDB 7 (`flashcard`, `quiz`)

---

## 4. Commands

```powershell
# Run Unit/Integration & Serialization Tests cho 4 services
.\src\services\marketplace-service\mvnw.cmd -f src\services\marketplace-service\pom.xml test
.\src\services\flashcard-service\mvnw.cmd -f src\services\flashcard-service\pom.xml test
.\src\services\quiz-service\mvnw.cmd -f src\services\quiz-service\pom.xml test
.\src\services\profile-service\mvnw.cmd -f src\services\profile-service\pom.xml test

# Build & Start toàn bộ stack bao gồm Redis
docker compose up -d --build redis config-service marketplace-service flashcard-service quiz-service profile-service

# Health & Ping Check Redis trong Docker
docker compose exec redis redis-cli -a seika_redis_secret ping

# Inspect Redis Keys & Values
docker compose exec redis redis-cli -a seika_redis_secret keys "marketplace:products:active::*"
docker compose exec redis redis-cli -a seika_redis_secret get "marketplace:products:active::public"
```

---

## 5. Project Structure

```
src/
├── config-service/src/main/resources/configs/
│   ├── marketplace-service.yaml / marketplace-service-prod.yaml → Dev dùng fallback, Prod bắt buộc ${REDIS_PASSWORD}
│   ├── flashcard-service.yaml / flashcard-service-prod.yaml     → Dev dùng fallback, Prod bắt buộc ${REDIS_PASSWORD}
│   ├── quiz-service.yaml / quiz-service-prod.yaml               → Dev dùng fallback, Prod bắt buộc ${REDIS_PASSWORD}
│   └── profile-service.yaml / profile-service-prod.yaml         → Dev dùng fallback, Prod bắt buộc ${REDIS_PASSWORD}
└── services/
    ├── marketplace-service/
    │   ├── pom.xml                    → Thêm spring-boot-starter-data-redis
    │   ├── src/main/java/com/seika/marketplace_service/
    │   │   ├── config/RedisCacheConfig.java
    │   │   ├── dto/ProductResponse.java (DTO riêng để cache và trả về, thay thế JPA entity)
    │   │   ├── controller/ProductController.java (Đồng bộ trả về ProductResponse)
    │   │   ├── helper/ProductCatalogCacheHelper.java (Bean riêng tránh Spring self-invocation cho @Cacheable public catalog)
    │   │   ├── service/ProductService.java (In-memory user filtering & detail caching)
    │   │   ├── service/AdminProductService.java (Evict on approve/reject/hide)
    │   │   └── consumer/ProductEventListener.java (Evict on RabbitMQ content events)
    │   └── src/test/java/com/seika/marketplace_service/RedisCacheSerializationTest.java
    ├── flashcard-service/
    │   ├── pom.xml                    → Thêm spring-boot-starter-data-redis
    │   ├── src/main/java/com/seika/flashcard_service/
    │   │   ├── config/RedisCacheConfig.java
    │   │   └── service/CardSetService.java (Cacheable & Evict cho create/update/delete; KHÔNG evict khi buy)
    │   └── src/test/java/com/seika/flashcard_service/RedisCacheSerializationTest.java
    ├── quiz-service/
    │   ├── pom.xml                    → Thêm spring-boot-starter-data-redis
    │   ├── src/main/java/com/seika/quiz_service/
    │   │   ├── config/RedisCacheConfig.java
    │   │   └── service/QuizSetService.java (Cacheable & Evict)
    │   └── src/test/java/com/seika/quiz_service/RedisCacheSerializationTest.java
    └── profile-service/
        ├── pom.xml                    → Thêm spring-boot-starter-data-redis
        ├── src/main/java/com/seika/profile_service/
        │   ├── config/RedisCacheConfig.java
        │   ├── service/UserProfileService.java (Cacheable, CachePut & Evict)
        │   └── consumer/TeacherStatsConsumer.java & RewardEventConsumer.java (Evict on EXP/Tier updates)
        └── src/test/java/com/seika/profile_service/RedisCacheSerializationTest.java
```

---

## 6. Code Style

```java
package com.seika.marketplace_service.helper;

import com.seika.marketplace_service.dto.ProductResponse;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Helper bean độc lập để đặt @Cacheable, tránh lỗi Spring self-invocation khi ProductService
 * vừa thực hiện cache catalog public vừa tiến hành lọc in-memory cho user cụ thể.
 */
@Component
@RequiredArgsConstructor
public class ProductCatalogCacheHelper {

    private final ProductRepository productRepository;

    @Cacheable(value = "marketplace:products:active", key = "'public'")
    public List<ProductResponse> getPublicPublishedProducts() {
        return productRepository.findByActiveTrueAndStatusOrderByCreatedAtDesc(ProductStatus.PUBLISHED)
                .stream()
                .map(ProductResponse::fromEntity)
                .toList();
    }
}
```

---

## 7. Testing Strategy

- **Serialization & Deserialization Unit Tests (Bắt buộc)**: Tại mỗi microservice, phải viết class `RedisCacheSerializationTest.java` verify chính xác round-trip từ `DTO` → JSON trong Redis → `DTO` qua `GenericJackson2JsonRedisSerializer` để đảm bảo không lỗi deserialize và tuân thủ allowlist `PolymorphicTypeValidator`.
- **Unit/Slice Tests**: Chạy `mvnw test` tại mỗi service để kiểm tra logic @Cacheable và @CacheEvict hoạt động đúng.
- **Integration Tests / Manual Verification**: Khởi động container `redis` trong Docker, xác nhận Cache Hit / Miss và kiểm chứng sự thay đổi của cache JSON khi có write path hoặc RabbitMQ events.

---

## 8. Boundaries

- **Always do:**
  - Luôn kiểm tra test suites (đặc biệt là test deserialize round-trip DTO) pass trước khi hoàn tất mỗi task.
  - Luôn cache DTO (`ProductResponse`, `CardSetDTO`...), tuyệt đối không cache JPA entity hay Mongo document trực tiếp.
  - Luôn đồng bộ signatures ở Controller khi Service chuyển sang trả DTO (`ProductController` trả `ProductResponse`).
  - Luôn tách bean/helper (`ProductCatalogCacheHelper`) hoặc gọi qua proxy khi muốn áp dụng `@Cacheable` và tiếp tục lọc in-memory trong cùng flow, tránh Spring self-invocation.
- **Ask first:**
  - Nếu cần thay đổi cấu trúc DB hay thêm dependencies bên thứ 3 ngoài `spring-boot-starter-data-redis`.
  - Nếu cần can thiệp vào `identity-service` hoặc thay đổi authentication mechanism.
- **Never do:**
  - Không hardcode mật khẩu hay để giá trị fallback `seika_redis_secret` trong cấu hình production (`docker-compose.prod.yml` và các file `*-prod.yaml`).
  - Không expose port `6379` ra host trong `docker-compose.prod.yml`.
  - Không sử dụng `activateDefaultTyping()` rộng rãi mà không có allowlist khắt khe.
  - Không thực hiện evict cache không cần thiết (chẳng hạn như trong `CardSetService.buy()` khi DTO không thay đổi).

---

## 9. Success Criteria

1. Container `redis:7.4-alpine` khởi động thành công với cấu hình bảo mật dev (`docker-compose.yml`) và prod (`docker-compose.prod.yml` không có fallback secret, không expose port).
2. Cấu hình YAML tại `config-service` phân định rõ ràng giữa dev (`*-service.yaml`/`*-service-dev.yaml`) và production (`*-service-prod.yaml` bắt buộc `${REDIS_PASSWORD}` không fallback).
3. 4 microservices (`marketplace`, `flashcard`, `quiz`, `profile`) build & test thành công 100%, bao gồm unit test bắt buộc kiểm chứng serialize/deserialize cho từng DTO (`ProductResponse`, `CardSetDTO`, `QuizSetResponse`, `UserProfileResponse`).
4. Catalog Marketplace sử dụng DTO `ProductResponse`, đồng bộ hoàn toàn từ Service đến `ProductController`, và dùng bean helper độc lập (`ProductCatalogCacheHelper`) đảm bảo 100% cache hit cho public list mà không vướng self-invocation.
5. Ma trận xóa cache (Eviction) chuẩn xác, loại bỏ các thao tác evict thừa (`buy()` ở flashcard) và bọc lót đủ cho admin, seller và RabbitMQ consumers.
