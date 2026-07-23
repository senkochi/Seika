# Repository Guidelines

> Architecture and contributor context for humans and coding agents. Last verified against the repository on 2026-07-22.

## How to Use This File

Treat source code, active YAML, POMs, package manifests, and Compose files as the source of truth. CLAUDE.md remains useful historical context but is stale: when it conflicts with this file or executable configuration, follow the code/configuration. Before changing a module, read its local application.yaml, central Config Server files, related tests, and one nearby implementation of the same pattern.

Do not perform broad cleanup while implementing a feature. Package roots, response wrappers, and API conventions are not fully uniform across services. Preserve the local contract unless the task explicitly includes a migration.

## What Seika Is

Seika is a Vietnamese-first learning and digital-content platform. Students learn flashcards and quizzes, buy teacher-created content, earn coins and experience, and receive real-time notifications. Teachers publish content, receive tier-based marketplace earnings, and view sales statistics. Administrators manage users, content moderation, economy settings, revenue, escrow disputes, and collusion risk.

The monorepo contains:

- A Java 21, Spring Boot 4.0.4, Spring Cloud 2025.1.1 microservice backend built with Maven.
- A React 19, TypeScript 5.9, Vite 6 single-page application in src/web-app.

The frontend is not part of either current Docker Compose stack; run or deploy it separately.

## System Topology

```text
React SPA (:5173 by default)
        |
        | HTTP + Bearer JWT / SSE
        v
API Gateway (:8080) ---- Redis (:6379, JWT blacklist)
        |
        | lb:// service discovery
        v
Eureka (:8761) <---- Config Server (:8888) ---- classpath:/configs
        |                     |
        +---- Spring services +---- environment values from root .env
                   |
        +----------+-----------+
        |                      |
 PostgreSQL / MongoDB      RabbitMQ (:5672)
 per-service ownership     integration events + commands
```

All public API traffic should enter through the Gateway. Services register with Eureka and load runtime configuration from Config Server. RabbitMQ carries cross-service domain events and wallet commands. Redis is shared for JWT revocation and read caches. Each business service owns its database; never join across service databases.

## Repository Map

- pom.xml: parent POM and backend module list; centralizes Java/Spring versions and observability dependencies.
- src/api-gateway: reactive Gateway, JWT validation, Redis blacklist checks, routing, and aggregated OpenAPI.
- src/config-service: native Spring Cloud Config Server. Runtime files are under src/config-service/src/main/resources/configs as base plus optional dev/prod overlays.
- src/eureka: service registry.
- src/services/\*-service: independently owned business services with module-local tests.
- src/web-app: React SPA, Redux store, API client, layouts, pages, and UI components.
- docker-compose.yml and docker-compose.prod.yml: backend and infrastructure stacks.
- docker-compose.observability.yml and observability/: Prometheus, Grafana, Loki, Promtail, and Tempo.
- documentation/: standards, guides, Redis/observability notes, and report chapters.
- docs/: current economy/escrow plans, runbooks, audits, implementation records, and bug reports.
- .github/workflows/deploy.yml: self-hosted production deployment on pushes to master. It currently deploys Compose without a CI test matrix.

## Runtime Service Catalog

Ports are the current root .env and Compose values.

| Component     | Port | Storage/cache                    | Responsibility                                                                                |
| ------------- | ---: | -------------------------------- | --------------------------------------------------------------------------------------------- |
| API Gateway   | 8080 | Redis                            | Routes APIs, validates JWTs, rejects revoked tokens, injects user headers, aggregates Swagger |
| Eureka        | 8761 | In-memory registry               | Service discovery                                                                             |
| Config Server | 8888 | Classpath YAML                   | Central configuration with environment substitution                                           |
| Identity      | 8081 | PostgreSQL identity-db, Redis    | Users, roles, auth/refresh/logout, admin users, JWT issuance/revocation                       |
| Profile       | 8082 | PostgreSQL profile-db, Redis     | User, game, and teacher profiles; teacher statistics/tier projection                          |
| Notification  | 8083 | MongoDB                          | Persistent notifications, event consumers, per-instance SSE connections                       |
| Wallet        | 8084 | PostgreSQL wallet-db             | Multi-bucket balances, ledger, holds/freezes, cash flows, configs, idempotent commands        |
| Marketplace   | 8085 | PostgreSQL marketplace-db, Redis | Catalog, moderation, orders, inventory, reviews, ratings, escrow, collusion                   |
| Flashcard     | 8086 | MongoDB, Redis                   | Card sets, study sessions, ownership/sales projections, completion events                     |
| Quiz          | 8087 | MongoDB, Redis                   | Quiz sets/questions/attempts, statistics, completion events                                   |
| Reward        | 8088 | PostgreSQL reward-db             | Reward rules/cooldowns, learning reward log, reward outbox                                    |

Infrastructure uses PostgreSQL 16 with one database/container per relational service; MongoDB 7 as the rs0 single-node replica set for notification, flashcard, and quiz databases; RabbitMQ 4.3 management; and Redis 7.4 with password authentication, a 256 MB limit, and allkeys-lru eviction.

## Request, Configuration, and Authentication Flow

1. A service's local src/main/resources/application.yaml sets spring.application.name, imports configserver:, and configures retry/fail-fast behavior.
2. Config Server serves base and active-profile files from classpath:/configs. Root .env values are passed into Config Server by Compose and substituted into service configuration.
3. The Gateway resolves lb://SERVICE-ID routes through Eureka. Main prefixes are /api/auth, /api/admin, /api/profiles, /api/wallet, /api/marketplace, /api/flashcards, /api/quiz, /api/quiz-sets, /api/notifications, and /api/rewards.
4. Identity issues HS256 access tokens with a unique jti, issuer, username subject, userId, and roles. Refresh tokens are persisted in PostgreSQL.
5. Logout stores auth:blacklist::{jti} in Redis until the access token expires. The Gateway validates signature, token structure/expiry, and the blacklist before routing. Although jwt.issuer is configured and emitted, the current parser logs but does not require that issuer.
6. The Gateway preserves the Bearer token and injects X-User-Name, X-User-Id, and X-User-Roles. Servlet services validate the JWT again and build their own Spring Security context.

Do not trust user-supplied X-User-\* headers at a directly exposed service. The notification SSE endpoint currently reads X-User-Id, so it must be reached through the Gateway. Direct service access can also bypass the Gateway blacklist check; restrict production exposure accordingly.

Gateway routes exist in both src/api-gateway/src/main/resources/application.yaml and configs/api-gateway.yaml. Keep both synchronized when adding routes or Swagger entries. The current public-path config names /api/auth/jwt-validate, while the implemented endpoint is /api/auth/jwt-introspect; verify intent before changing either.

## Service Responsibilities and Boundaries

### Identity Service

Owns credentials, roles, refresh tokens, JWT generation, blacklist writes, and admin user controls. Registration creates a profile synchronously through ProfileClient and publishes identity.events / user.registered for wallet, profile, and notification projections. Admin dashboard aggregation calls wallet and marketplace internal endpoints. Never duplicate password or signing-key logic elsewhere.

### Profile Service

Owns user, game, and teacher projections. It consumes registration, content-created, purchase, teacher-tier, and reward events to update counts, tier/rating data, experience, and reach. profile:user is cached for 60 minutes and updated or evicted on writes/events.

### Flashcard and Quiz Services

Own learning content and attempts or sessions in separate MongoDB databases. Creation, update, and consumption publish content.events. Learning completion publishes learning.events as deck.completed or quiz.completed. Both retain Feign wallet clients and direct purchase-related code, but marketplace order/inventory is the authoritative cross-content commerce path. Redis caches detail and author queries; writes evict affected caches.

Quiz types are polymorphic: multiple choice, reorder, matching, and fill-in-the-blank. Preserve DTO/domain discriminator names when extending quiz behavior.

### Marketplace Service

Owns the searchable catalog and moderation state independently from source content, plus orders, order items, inventory, reviews, teacher ratings, marketplace configuration, escrows, collusion flags, admin action logs, and inbox/outbox tables.

Purchase flow:

1. Canonicalize product data and save a PENDING_PAYMENT order plus wallet.debit.requested in the same PostgreSQL transaction/outbox.
2. The outbox publishes to wallet.commands. Wallet debits idempotently and publishes wallet.debit.succeeded or wallet.debit.failed through its outbox.
3. Marketplace deduplicates wallet results in inbox, marks a successful order paid, grants inventory, creates per-item held escrows, and emits content.purchased.
4. A scheduled job releases due escrows. Marketplace calculates teacher/platform splits from source-of-funds and teacher-tier settings, then emits wallet credit commands. Refund and partial-refund commands use the same result-event loop.
5. Pessimistic locks, event/business idempotency keys, and inbox/outbox records protect monetary state. Never replace this flow with synchronous balance mutations.

A daily collusion scan can flag suspicious teacher/buyer activity. Confirmed flags publish collusion.flagged; Wallet can freeze or hold funds. Escrows requiring review are handled through admin endpoints.

### Wallet Service

Owns the financial ledger. A wallet separates bonus, reward, paid, teacher-withdrawable, teacher-promo, and held balances. Monetary commands require stable idempotency keys and pessimistic wallet locking. Important artifacts include wallet_ledger_entries, wallet_idempotency_keys, wallet_holds, and wallet_outbox_events.

The command consumer handles debit, credit, and refund requests. Result events are written transactionally to the wallet outbox; a scheduler publishes with retry/backoff and DLQ support. Preserve BigDecimal scale/rounding, source-of-funds breakdowns, ledger records, and outbox writes in the same transaction.

### Reward Service

Consumes passed quiz and completed deck events from learning.events. It applies configured reward amounts and cooldown/idempotency rules, stores LearningRewardLog, and publishes reward.granted through reward_outbox. Wallet credits reward coins; Profile applies experience; Notification informs the user. Quiz rewards currently default to medium difficulty in RewardProcessor; difficulty-specific rewards are not fully wired.

### Notification Service

Consumes identity, marketplace, reward, and wallet events, persists notifications in MongoDB, and pushes them through SSE at /api/notifications/stream. Emitters are held in an in-memory map, so connections are instance-local; horizontal scaling requires sticky routing or a shared fan-out design.

## RabbitMQ Event Map

| Exchange           | Important routing keys                                     | Main producers          | Main consumers                                 |
| ------------------ | ---------------------------------------------------------- | ----------------------- | ---------------------------------------------- |
| identity.events    | user.registered                                            | Identity                | Profile, Wallet, Notification                  |
| content.events     | flashcard.set._, quiz.set._                                | Flashcard, Quiz         | Marketplace, Profile                           |
| marketplace.events | content.purchased, teacher.tier.updated, collusion.flagged | Marketplace             | Flashcard, Quiz, Profile, Wallet, Notification |
| wallet.commands    | wallet.debit/credit/refund.requested                       | Marketplace outbox      | Wallet                                         |
| wallet.events      | debit/credit/refund results, wallet.updated.#              | Wallet                  | Marketplace, Notification                      |
| learning.events    | deck.completed, quiz.completed, reward.granted             | Flashcard, Quiz, Reward | Reward, Wallet, Profile, Notification          |

Event DTOs are duplicated per service rather than shared as a library. When changing a payload, update every producer/consumer copy and compatibility test. Maintain eventId, correlationId, and idempotencyKey semantics where present. Consumers must tolerate redelivery.

## Redis Architecture

Redis is not merely an optional performance layer:

- auth:blacklist::{jti} is a correctness/security key shared by Identity and Gateway. TTL equals remaining access-token lifetime.
- marketplace:products:active defaults to 30 minutes; marketplace:products:detail to 60 minutes.
- flashcards:detail defaults to 60 minutes; flashcards:author to 30 minutes.
- quizzes:set:detail defaults to 60 minutes; quizzes:set:author to 30 minutes.
- profile:user defaults to 60 minutes.

Cache configuration classes contain shared names not necessarily used by their owning service; document and modify actual annotation usage, not merely configured names. Any write or event projection that changes cached data must update or evict the relevant keys. Compose starts Redis, but service stanzas do not health-gate on it, so check Redis first when auth or cached reads fail during startup.

## Frontend Architecture

src/web-app/src/routes.tsx lazy-loads three role-oriented trees: /student/dashboard, /teacher/dashboard, and /admin/dashboard. Layouts provide role gating and navigation. /dashboard redirects to the student dashboard for compatibility.

Redux Toolkit lives in src/store with auth, userProfile, notifications, statistics, admin, and ui slices. Use typed useAppDispatch and useAppSelector hooks. API access is centralized under src/api:

- client.ts: one Axios instance, VITE_API_BASE_URL (default http://localhost:8080/api), Bearer header, queued refresh-on-401 interceptor, and forced logout.
- types.ts: transport contracts.
- adapters.ts: backend-to-UI normalization.
- services/\*.ts: domain clients. UI code should import through API barrels rather than construct Axios clients.

Authentication is stored under seika.auth in local or session storage. Notification SSE uses fetch instead of EventSource so it can attach Authorization; it implements abortable exponential-backoff reconnect and dispatches incoming notifications into Redux.

The UI stack includes Tailwind 4, MUI 7, Radix primitives, Motion/GSAP, Recharts, i18next, and reusable components under components/ui. The @ alias maps to src/.

## Build, Run, and Test

### Full backend stack

```powershell
docker compose up -d --build
docker compose up -d
docker compose watch
docker compose logs -f api-gateway
docker compose down
```

The last command stops containers but preserves named volumes. Useful endpoints are Gateway http://localhost:8080, Swagger http://localhost:8080/swagger-ui.html, Eureka http://localhost:8761, Config Server http://localhost:8888, and RabbitMQ UI http://localhost:15672.

### Backend modules

The root has no Maven wrapper; each module has its own. With system Maven, mvn test at the root runs the reactor. A focused Windows command is:

```powershell
.\src\services\identity-service\mvnw.cmd -f src/services/identity-service/pom.xml test
.\src\services\identity-service\mvnw.cmd -f src/services/identity-service/pom.xml -Dtest=AuthServiceTest test
.\src\services\identity-service\mvnw.cmd -f src/services/identity-service/pom.xml package -DskipTests
```

Substitute the module path. Tests use JUnit Jupiter/Spring Boot Test, Mockito, H2 test profiles where configured, and Testcontainers for selected integrations. Put tests in the owning module and mirror production packages.

### Frontend

```powershell
npm install
npm --prefix src/web-app install --legacy-peer-deps
npm --prefix src/web-app run dev
npm --prefix src/web-app run lint
npm --prefix src/web-app run typecheck
npm --prefix src/web-app run build
```

There is no frontend npm test script. Lint, typecheck, and production build are required unless the task adds a test runner.

### Observability

```powershell
docker compose -f docker-compose.observability.yml up -d
```

Prometheus scrapes Gateway and ports 8081-8088 at /actuator/prometheus. Services export OTLP HTTP traces to Tempo and include trace/span IDs in logs. Grafana (:3000) is provisioned with Prometheus, Loki, and Tempo. Prometheus is :9090, Loki :3100, and Tempo :3200/:4317/:4318. This stack has a separate Compose lifecycle.

## Coding and Change Rules

### Java and Spring

- Preserve the package root used by the module. Wallet primarily uses com.cardy.walletService; Profile contains the historical enity package typo. Do not rename these as incidental cleanup.
- Keep controllers thin, business logic in services, persistence in repositories, request/response DTOs separate, Jakarta validation at boundaries, and MapStruct where already used.
- Use constructor injection and @Slf4j; never add System.out.
- Put transaction boundaries on service operations. Mark pure reads read-only when consistent with the module.
- Use BigDecimal for money. Never use floating-point arithmetic in wallet or marketplace paths.
- Follow the neighboring exception and response pattern. documentation/rules/CODING_STANDARDS.md describes the target ApiResponse/PagedResponse style, but existing endpoints are not uniform; do not silently break clients to enforce it.
- API prefixes are the concrete Gateway paths listed above, not a globally enforced /api/v1 convention.

### TypeScript and React

- Use functional components, typed props/contracts, typed Redux hooks, and the existing @ alias.
- Keep network logic in src/api/services and adapt backend shapes before pages/components.
- Avoid any in new code even where legacy interceptor injection still uses it.
- Reuse existing UI primitives and tokens before introducing another component system.
- Run ESLint, TypeScript, and Vite build after frontend changes. Root Husky/lint-staged runs ESLint and Prettier on supported staged files.

### Events, Data, and Security

- Database ownership is strict. Communicate through APIs/events, never cross-database queries.
- Monetary/event workflows require idempotency, atomic state plus outbox writes, deduplicating consumers, and retry-safe handlers.
- Runtime JPA currently uses ddl-auto=update; there is no repository-wide Flyway/Liquibase workflow. Treat schema changes as deployment-sensitive and update reset/runbook scripts.
- Never commit or print .env, JWT secrets, database passwords, or Redis credentials. Add configuration through .env variable names, Compose forwarding, Config Server overrides, and service YAML together.
- A new backend service requires a parent POM module, Dockerfile/Compose stanza, Config Server files, Eureka registration, Gateway and OpenAPI routes, and observability target.

## Known Gotchas

- CLAUDE.md predates parts of Redis, rewards, admin, escrow, and collusion architecture and incorrectly says the frontend is containerized.
- Some older docs reference documentation/CODING_STANDARDS.md; the current path is documentation/rules/CODING_STANDARDS.md.
- flashcard-service.yaml falls back to port 8085, but .env, overlays, Compose, Gateway, and Prometheus use 8086. Always provide the environment port.
- Gateway route definitions are duplicated between local and Config Server YAML.
- Notification SSE is in-memory and keyed by the Gateway-injected user header.
- Reward quiz difficulty mapping is incomplete and defaults to medium.
- The self-hosted deploy workflow copies .env from E:\Seika\.env; moving the runner requires updating that path.
- The deploy workflow lacks build/test/lint gates. Run relevant checks before merging.

## Reference Documents

Read only the subset relevant to the task:

- documentation/rules/CODING_STANDARDS.md: backend conventions.
- src/web-app/API*ARCHITECTURE*&\_GUIDELINES.md: frontend API boundary.
- src/web-app/STATE_MANAGEMENT_REDUX_ARCHITECTURE.md: Redux patterns.
- src/web-app/INSTALLATION_GUIDE.md: peer-dependency installation.
- documentation/REDIS_CACHING_PHASE_1_SUMMARY.md and PHASE_2_SUMMARY.md: cache rollout history; verify against code.
- documentation/OBSERVABILITY_LGTM_GUIDE.md and OBSERVABILITY_USAGE_GUIDE.md: monitoring workflow.
- docs/runbooks and docs/implementation: marketplace, wallet, and escrow business context.
- docs/bug-reports: known marketplace, escrow, and notification failure history.

## Commit and Pull Request Expectations

History mostly follows Conventional Commit subjects such as feat:, fix:, style:, with optional scopes such as feat(phase 2):. Keep commits focused and imperative. Pull requests must identify affected services, API/event/schema/config changes, compatibility impact, and verification commands. Include screenshots for UI work and explicitly call out changes to money, auth, Redis keys, RabbitMQ payloads, or deployment configuration.
