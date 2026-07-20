# Task Breakdown - Redis Distributed Caching Integration (Revised & Hardened v3)

- [x] Task 1: Redis Infrastructure & Environment Configuration (Dev vs Prod Separation)
  - Acceptance:
    - `docker-compose.yml` có container `redis:7.4-alpine` với `requirepass ${REDIS_PASSWORD:-seika_redis_secret}`, `--maxmemory 256mb --maxmemory-policy allkeys-lru`, volume `redis_data` và healthcheck.
    - `docker-compose.prod.yml` yêu cầu `${REDIS_PASSWORD?REDIS_PASSWORD is required in production}`, `--maxmemory 512mb --maxmemory-policy allkeys-lru`, và **không expose port `6379` ra host**.
    - `.env` bổ sung `REDIS_HOST=redis`, `REDIS_PORT=6379`, `REDIS_PASSWORD=seika_redis_secret`.
    - Các file YAML cấu hình trong `src/config-service/src/main/resources/configs/` được phân tách rõ ràng: base/dev config dùng fallback `${REDIS_PASSWORD:seika_redis_secret}`, các file prod (`*-prod.yaml`) **tuyệt đối không có fallback** (`password: ${REDIS_PASSWORD}`).
  - Verify:
    - Chạy `docker compose up -d redis` và xác nhận healthcheck: `docker compose exec redis redis-cli -a seika_redis_secret ping` trả về `PONG`.
  - Files:
    - `docker-compose.yml`
    - `docker-compose.prod.yml`
    - `.env`
    - `src/config-service/src/main/resources/configs/marketplace-service.yaml`
    - `src/config-service/src/main/resources/configs/marketplace-service-prod.yaml`
    - `src/config-service/src/main/resources/configs/flashcard-service.yaml`
    - `src/config-service/src/main/resources/configs/flashcard-service-prod.yaml`
    - `src/config-service/src/main/resources/configs/quiz-service.yaml`
    - `src/config-service/src/main/resources/configs/quiz-service-prod.yaml`
    - `src/config-service/src/main/resources/configs/profile-service.yaml`
    - `src/config-service/src/main/resources/configs/profile-service-prod.yaml`

- [x] Task 2a: Shared Dependency & Redis Cache Configuration across 4 Services
  - Acceptance:
    - Thêm dependency `spring-boot-starter-data-redis` vào `pom.xml` của `marketplace-service`, `flashcard-service`, `quiz-service`, và `profile-service`.
    - Tạo class `RedisCacheConfig.java` tại package `com.seika.{service}.config.RedisCacheConfig` trong cả 4 service với `@EnableCaching`, `GenericJackson2JsonRedisSerializer` sử dụng strict allowlist `PolymorphicTypeValidator` (`com.seika.`, `java.util.`, `java.time.`), và cấu hình static tiered TTLs (30 phút cho list, 60 phút cho detail/profile).
  - Verify:
    - Kiểm tra compile thành công cho cả 4 services:
      ```powershell
      .\src\services\marketplace-service\mvnw.cmd -f src\services\marketplace-service\pom.xml test-compile -q
      .\src\services\flashcard-service\mvnw.cmd -f src\services\flashcard-service\pom.xml test-compile -q
      .\src\services\quiz-service\mvnw.cmd -f src\services\quiz-service\pom.xml test-compile -q
      .\src\services\profile-service\mvnw.cmd -f src\services\profile-service\pom.xml test-compile -q
      ```
  - Files:
    - `src/services/marketplace-service/pom.xml`
    - `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/config/RedisCacheConfig.java`
    - `src/services/flashcard-service/pom.xml`
    - `src/services/flashcard-service/src/main/java/com/seika/flashcard_service/config/RedisCacheConfig.java`
    - `src/services/quiz-service/pom.xml`
    - `src/services/quiz-service/src/main/java/com/seika/quiz_service/config/RedisCacheConfig.java`
    - `src/services/profile-service/pom.xml`
    - `src/services/profile-service/src/main/java/com/seika/profile_service/config/RedisCacheConfig.java`

- [x] Task 2b: Mandatory DTO Round-Trip Serialization Tests across 4 Services
  - Acceptance:
    - Viết unit test `RedisCacheSerializationTest.java` tại package `com.seika.{service}` trong cả 4 service (`marketplace`, `flashcard`, `quiz`, `profile`).
    - Verify chính xác khả năng serialize & deserialize (round-trip) qua `GenericJackson2JsonRedisSerializer` và `PolymorphicTypeValidator` allowlist cho từng cached DTO (`ProductResponse`, `CardSetDTO`, `QuizSetResponse`, `UserProfileResponse`).
  - Verify:
    - Chạy test serialization thành công cho cả 4 services:
      ```powershell
      .\src\services\marketplace-service\mvnw.cmd -f src\services\marketplace-service\pom.xml test -Dtest=*Serialization* -q
      .\src\services\flashcard-service\mvnw.cmd -f src\services\flashcard-service\pom.xml test -Dtest=*Serialization* -q
      .\src\services\quiz-service\mvnw.cmd -f src\services\quiz-service\pom.xml test -Dtest=*Serialization* -q
      .\src\services\profile-service\mvnw.cmd -f src\services\profile-service\pom.xml test -Dtest=*Serialization* -q
      ```
  - Files:
    - `src/services/marketplace-service/src/test/java/com/seika/marketplace_service/RedisCacheSerializationTest.java`
    - `src/services/flashcard-service/src/test/java/com/seika/flashcard_service/RedisCacheSerializationTest.java`
    - `src/services/quiz-service/src/test/java/com/seika/quiz_service/RedisCacheSerializationTest.java`
    - `src/services/profile-service/src/test/java/com/seika/profile_service/RedisCacheSerializationTest.java`

- [x] Task 3: Caching, DTO Standardization, Controller Sync & Eviction Implementation in Marketplace Service
  - Acceptance:
    - **Tạo DTO `ProductResponse.java`** (`com.seika.marketplace_service.dto.ProductResponse`) chứa đầy đủ các trường của `Product` entity để trả về từ service và lưu trong cache (thay thế hoàn toàn việc cache JPA entity).
    - **Đồng bộ chữ ký `ProductController.java`** (`com.seika.marketplace_service.controller.ProductController`) để trả về `ResponseEntity<List<ProductResponse>>` và `ResponseEntity<ProductResponse>` thay vì JPA entity `Product`.
    - **Tạo helper bean độc lập `ProductCatalogCacheHelper.java`** (`com.seika.marketplace_service.helper`) chứa hàm `@Cacheable(value = "marketplace:products:active", key = "'public'") getPublicPublishedProducts()` nhằm tránh hoàn toàn lỗi Spring AOP self-invocation.
    - Tại `ProductService.java`: Hàm `getActiveProducts(userId)` gọi qua `catalogCacheHelper.getPublicPublishedProducts()` và tiến hành lọc in-memory (`userInventoryRepository` + `orderRepository`) khi có `userId`. Thêm `@Cacheable("marketplace:products:detail")` cho `getActiveProductById(id)` trả về `ProductResponse`.
    - Thêm eviction cho `marketplace:products:detail::*` và `marketplace:products:active::*` khi gọi `archive()` và `hardDelete()` trong `ProductService`.
    - Thêm eviction khi Admin thao tác `approve()`, `reject()`, `hide()` trong `AdminProductService`.
    - Thêm eviction trong `ProductEventListener` khi xử lý các sự kiện RabbitMQ: `flashcard.set.created`, `quiz.set.created`, `flashcard.set.updated`, `quiz.set.updated`.
  - Verify:
    - Chạy toàn bộ test suite của marketplace-service: `.\src\services\marketplace-service\mvnw.cmd -f src\services\marketplace-service\pom.xml test`.
  - Files:
    - `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/dto/ProductResponse.java`
    - `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/controller/ProductController.java`
    - `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/helper/ProductCatalogCacheHelper.java`
    - `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/ProductService.java`
    - `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/service/AdminProductService.java`
    - `src/services/marketplace-service/src/main/java/com/seika/marketplace_service/consumer/ProductEventListener.java`

- [x] Task 4: Caching & Eviction Implementation in Flashcard & Quiz Services
  - Acceptance:
    - Tại `flashcard-service` (`CardSetService.java`): Thêm `@Cacheable` cho `getById()` (`flashcards:detail::id`) và `getByAuthor()` (`flashcards:author::authorId`). Thêm eviction khi `create()`, `update()`, `delete()`. _(Lưu ý: Không thêm eviction vào hàm `buy()` do thao tác mua không làm thay đổi DTO)._
    - Tại `quiz-service` (`QuizSetService.java` / `QuizSetServiceImpl.java`): Thêm `@Cacheable` cho get chi tiết (`quizzes:set:detail::id`) và danh sách theo tác giả. Thêm eviction khi `create()`, `update()`, `deleteByOwner()`.
  - Verify:
    - Chạy test suite của flashcard và quiz services:
      ```powershell
      .\src\services\flashcard-service\mvnw.cmd -f src\services\flashcard-service\pom.xml test
      .\src\services\quiz-service\mvnw.cmd -f src\services\quiz-service\pom.xml test
      ```
  - Files:
    - `src/services/flashcard-service/src/main/java/com/seika/flashcard_service/service/CardSetService.java`
    - `src/services/quiz-service/src/main/java/com/seika/quiz_service/service/QuizSetService.java` (hoặc `QuizSetServiceImpl.java`)

- [x] Task 5: Caching & Eviction Implementation in Profile Service
  - Acceptance:
    - Tại `UserProfileService.java`: Thêm `@Cacheable(value = "profile:user", key = "#userId")` trên `getUserProfileByUserId(userId)`. Thêm `@CachePut` / `@CacheEvict` khi gọi `createUserProfile()`, `updateUserProfile()`, và `addExp()`.
    - Thêm eviction/làm mới cache `profile:user::userId` trong các RabbitMQ consumer: `RewardEventConsumer.handleRewardGrantedEvent()` và `TeacherStatsConsumer` (`handleQuizSetCreated`, `handleFlashcardSetCreated`, `handleContentPurchased`, `handleTeacherTierUpdated`).
  - Verify:
    - Chạy test suite của profile-service: `.\src\services\profile-service\mvnw.cmd -f src\services\profile-service\pom.xml test`.
  - Files:
    - `src/services/profile-service/src/main/java/com/seika/profile_service/service/UserProfileService.java`
    - `src/services/profile-service/src/main/java/com/seika/profile_service/consumer/RewardEventConsumer.java`
    - `src/services/profile-service/src/main/java/com/seika/profile_service/consumer/TeacherStatsConsumer.java`

- [x] Task 6: End-to-End Verification & Integration Check
  - Acceptance:
    - Toàn bộ 4 services khởi động trơn tru cùng Redis container trong Docker Compose mà không có bất kỳ lỗi deserialization hay connect timeout nào.
    - Dữ liệu lưu trong Redis đúng chuẩn JSON, đọc được qua `redis-cli`, đúng key pattern (`::`), và cache hit hoạt động như kỳ vọng.
  - Verify:
    - Khởi động cụm `docker compose up -d --build redis config-service marketplace-service flashcard-service quiz-service profile-service`.
    - Kiểm tra keys trong Redis: `docker compose exec redis redis-cli -a seika_redis_secret ping` và test API call.
  - Files:
    - `tasks/todo.md` (Đánh dấu hoàn tất)
