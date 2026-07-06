# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Seika

Seika is a multi-service learning platform (flashcard + quiz + marketplace + wallet) with a Vietnamese UI. It is a single repository containing two loosely coupled projects:

- A **Spring Boot / Spring Cloud microservices backend** built with Maven (Java 21, Spring Boot 4.0.4, Spring Cloud 2025.1.1).
- A **React 19 + TypeScript + Vite web app** at `src/web-app`.

## Common Commands

### Run the full stack (Docker Compose)
All infrastructure (Postgres, Mongo, RabbitMQ, Eureka, Config Server, every service, the gateway) and the React app are containerised. From the repo root:

```bash
# First time / after a code change
docker compose up -d --build

# Resume without rebuilding
docker compose up -d

# Rebuild only one service (faster inner-loop)
docker compose build wallet-service
docker compose up -d wallet-service
```

The `.env` file at the repo root holds DB URLs, JWT secret, ports, etc. The Config Server (`config-service`) reads it and serves per-service config to every microservice; the per-service `application.yaml` only declares `spring.config.import=configserver:`.

Useful URLs once up:
- Eureka dashboard: http://localhost:8761/
- Aggregated Swagger UI (via gateway): http://localhost:8080/swagger-ui.html
- Per-service Swagger UI: served by each service directly (e.g. http://localhost:8081/swagger-ui.html for identity).

### Frontend (web-app)
The web-app container is part of `docker compose`, but for a faster inner loop run it on the host:

```bash
cd src/web-app
npm install --legacy-peer-deps   # REQUIRED — peer-deps conflict forces the flag (see INSTALLATION_GUIDE.md)
npm run dev          # Vite dev server
npm run lint         # ESLint
npm run typecheck    # tsc -b
npm run build        # production build
```

`VITE_API_BASE_URL` overrides the API base (default `http://localhost:8080/api`).

If you add `react-day-picker` (or any new peer-dep package), use `npm install <pkg> --legacy-peer-deps`. New ReactBit components must be installed into `src/components/reactbit` via `npx reactbit add --path src/components/reactbit`.

### Backend (Maven)
Each Spring module has its own `mvnw` wrapper (`src/services/<svc>/mvnw`, `src/api-gateway/mvnw`, etc.); the repo root has no wrapper. Use the wrapper of the module whose artifact you want to build. Compose builds set `SPRING_PROFILE` from `.env` (default `dev`). Per-profile config lives in `src/config-service/src/main/resources/configs/{service}.yaml` and `{service}-{profile}.yaml`.

```bash
# Compile a single service (fast sanity check)
./src/services/quiz-service/mvnw -pl src/services/quiz-service -am compile -q -DskipTests

# Build one service jar (used by compose)
./src/services/identity-service/mvnw -pl src/services/identity-service -am package -DskipTests

# Run all tests for one service
./src/services/quiz-service/mvnw -pl src/services/quiz-service -am test

# Run a single test class
./src/services/identity-service/mvnw -pl src/services/identity-service -am test -Dtest=AuthServiceTests
```

## Repository Layout

- `pom.xml` — parent POM listing every backend module.
- `docker-compose.yml` (dev) / `docker-compose.prod.yml` (prod) — full stack incl. infra.
- `docker-compose.observability.yml` — independent Prometheus/Grafana/Loki/Tempo stack; bring up separately.
- `.env` — secrets, ports, DB URLs, JWT settings. Compose substitutes it; `config-service` reads it.
- `documentation/` — Vietnamese architecture/setup docs (see "Useful docs" below for index).
- `src/eureka/`, `src/config-service/`, `src/api-gateway/` — cross-cutting infra (registry, config, single entry point).
- `src/services/{identity,profile,wallet,marketplace}-service/` — Postgres-backed, ports `8081/8082/8084/8085`.
- `src/services/{notification,flashcard,quiz}-service/` — MongoDB-backed, ports `8083/8086/8087`.
- `src/services/reward-service/` — Postgres, port `8088`; **no gateway route yet** — treat as backend-only.
- `src/web-app/` — React 19 + Vite + Redux Toolkit frontend.
- `.github/workflows/deploy.yml` — self-hosted runner; pushes `master` → `docker compose -f docker-compose.prod.yml up -d --build`.
- `scripts/load-test.js` — k6 load-test (run with `k6 run scripts/load-test.js`; see `documentation/LOAD_TESTING_GUIDE.md`).
- `.husky/pre-commit` + root `package.json` `lint-staged` — runs `eslint` on staged web-app files and `prettier` on staged `*.{js,jsx,ts,tsx,json,md,html,css}`.

## Backend Architecture

**Cross-cutting infrastructure** (every service registers here):
- **Eureka** (`src/eureka`): service discovery. Each service has `spring-cloud-starter-netflix-eureka-client` and registers itself.
- **Config Server** (`src/config-service`): serves per-service YAML by `spring.application.name` + profile. Every service imports `configserver:` and has `fail-fast: true` with retry.
- **API Gateway** (`src/api-gateway`): reactive WebFlux gateway. Routes are declared in `src/api-gateway/src/main/resources/application.yaml` and use `lb://SERVICE-ID` for Eureka lookups. It also runs:
  - `AuthenticationFilter` (`src/api-gateway/src/main/java/com/seika/api_gateway/filter/AuthenticationFilter.java`) — validates JWT locally with the shared `JWT_SECRET` from `.env`, then injects `X-User-Id`, `X-User-Name`, `X-User-Roles` headers for downstream services. Public paths are listed under `app.api.public-endpoints` (sourced from Config Server).
  - `OpenAPIAggregationConfig` — aggregates every service's `/v3/api-docs/{service-name}` into the gateway's Swagger UI.

**Auth flow**:
1. Client POSTs `/api/auth/login` to the gateway → routed to `identity-service` (path `lb://IDENTITY-SERVICE`).
2. `identity-service` (`AuthService.java`) issues an HS256 JWT signed with `JWT_SECRET` (claims: `sub`=username, `userId`, `roles`).
3. For all non-public routes, the gateway's `AuthenticationFilter` re-validates the JWT and injects user headers; individual services do **not** call the identity service to validate.

**Service-to-service HTTP** uses **OpenFeign** with Eureka (`spring-cloud-starter-openfeign`). Examples:
- `identity-service` calls `ProfileClient` (see `src/services/identity-service/src/main/java/com/seika/identity_service/repository/httpclient/ProfileClient.java`) to provision a profile on registration.
- `flashcard-service` calls `WalletClient` to charge purchases.

**Async messaging** uses **RabbitMQ**. Topic exchange `identity.events` with routing keys like `user.registered`. `identity-service` (`UserEventPublisher`) publishes; `notification-service` and `wallet-service` consume. See `RabbitMQConfig` in any service and the consumer classes (e.g. `wallet-service/.../consumer/UserRegisteredConsumer.java`).

**Storage layout** (per `.env` and `docker-compose.yml`):
- Postgres 16: identity, profile, wallet, marketplace — separate DBs, separate ports `5432/5433/5434/5435`.
- MongoDB 7 (single-node replica set `rs0`): notification, flashcard, quiz — each its own database.
- RabbitMQ 4.3 (management UI on 15672): shared broker for all async events.

**Observability** (parent POM includes Spring Boot Actuator + Micrometer Prometheus + Micrometer Tracing OpenTelemetry + OTLP exporter on every service). Stack in `observability/`:
- Prometheus (`:9090`), Grafana (`:3000`), Loki (`:3100`), Promtail, Tempo (`:3200`, OTLP gRPC `:4317`).
- Bring up separately: `docker compose -f docker-compose.observability.yml up -d` (independent of the main stack).
- Toggle Prometheus + tracing endpoints in service configs: `update-configs.ps1` (Windows) or `scripts/enable_tracing.ps1` — patches `application.yaml` under `src/config-service/src/main/resources/configs/` to add `management.tracing.sampling.probability: 1.0` and a traceId/spanId log pattern. Run these once after fresh-cloning before you expect metrics/traces to flow.

### Java conventions (apply to every service)

Authoritative source: `documentation/CODING_STANDARDS.md`. Key points the conventions enforce:

- Package layout per service: `com.seika.{service-name}.{controller|service|repository|entity|domain|dto|mapper|config|security|event|client|consumer|exception|shared|constant}`.
- Java package roots differ between services (`com.seika.identity_service`, `com.cardy.walletService`, etc.) — match the existing root in the file you're editing, don't migrate wholesale.
- Endpoints: `/api/v1/{resource}` for collection; `/api/v1/{resource}/{id}` for item. REST verbs via HTTP method, not URL.
- All responses wrap in `ApiResponse<T>` (code, message, data, timestamp). Paginated responses wrap in `PagedResponse<T>` built via `PagedResponse.of(page)`.
- Exceptions extend a project base (e.g. `SeikaSException` in quiz; `ResourceNotFoundException`, `InvalidRequestException`, etc.) and are translated to `ApiResponse` by `@RestControllerAdvice GlobalExceptionHandler` in each service.
- DTOs are split: `XxxRequest` for input, `XxxResponse` for output. Validation uses Jakarta Bean Validation (`@NotBlank`, `@Size`, `@Min/@Max`, etc.) on the request DTOs.
- Logging via `@Slf4j`. Use `log.info/debug/warn/error`; do not use `System.out.println`.
- Mappers use **MapStruct** (`@Mapper` interfaces, e.g. `AuthMapper`, `CardSetMapper`).
- Services are annotated `@Service @RequiredArgsConstructor @Slf4j`; read methods are `@Transactional(readOnly = true)`.

### Adding a new service
1. Add a `<module>` entry in `pom.xml`.
2. Create a `Dockerfile` mirroring the others (`MODULE_DIR` build arg, multi-stage maven → temurin JRE).
3. Add a service stanza to `docker-compose.yml` (mirror an existing one), and add its env block to `.env`.
4. Add `{service}.yaml` and optionally `{service}-dev.yaml` under `src/config-service/src/main/resources/configs/`.
5. Add a route to `src/api-gateway/src/main/resources/application.yaml` (`uri: lb://{SERVICE-ID}`) and a `/v3/api-docs/{service}` aggregation entry + swagger URL.
6. Add a card to `documentation/api/{service}.json` if exporting OpenAPI.

## Frontend Architecture (`src/web-app`)

Stack: Vite 6 + React 19 + TypeScript 5.9 + React Router 7 + Redux Toolkit 2 + MUI 7 + Radix UI + Tailwind 4 + axios + GSAP/Motion + recharts. shadcn components live under `src/components/ui`, ReactBit components under `src/components/reactbit`.

- **Entry / routing**: `src/main.tsx` mounts the Redux `<Provider>`. `src/routes.tsx` defines a React Router 7 `createBrowserRouter` with `lazy()`-loaded pages; auth gating and role-based layout (Student vs Teacher) happen via `StudentDashboardLayout` / `TeacherDashboardLayout` under `src/layouts/`. Two top-level dashboards exist: `/student/dashboard/*` and `/teacher/dashboard/*`. The legacy `/dashboard` redirects to `/student/dashboard`.
- **State** (`src/store`): one slice per domain. Current slices: `authSlice.ts` (token, user identity, roles, request status, persistence) and `userProfileSlice.ts`. **All Redux access must go through the typed hooks in `src/store/hooks.ts` (`useAppDispatch`, `useAppSelector`)** — do not import `useDispatch`/`useSelector` directly. Async work goes through `createAsyncThunk`. See `STATE_MANAGEMENT_REDUX_ARCHITECTURE.md` in the web-app folder.
- **API layer** (`src/api`): single `axios.create()` instance in `client.ts` with base URL `VITE_API_BASE_URL` (default `http://localhost:8080/api`). `setAuthToken(token)` writes the `Authorization: Bearer …` header. The structure is fixed (see `API_ARCHITECTURE_&_GUIDELINES.md` in the web-app folder):
  - `client.ts` — axios instance + token setter. UI must never configure axios manually.
  - `types.ts` — shared `ApiResponse<T>`, DTOs. Never use `any` for backend payloads.
  - `errors.ts` — custom error classes for network/server/client failures.
  - `adapters.ts` — snake_case → camelCase transforms (etc.) before returning to UI.
  - `services/{auth,userProfiles,flashcards,quizzes,wallet,…}.ts` — one file per domain, exposes an object (e.g. `authService.register`, `authService.login`).
  - `index.ts` — barrel re-export; UI imports from `@/api` only.
- **Path alias**: `@` → `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

## Useful docs in this repo

Authoritative / non-obvious — read these before contributing to the matching area:

- `documentation/CODING_STANDARDS.md` — required Java conventions; the "Java conventions" summary above is just a recap.
- `src/web-app/API_ARCHITECTURE_&_GUIDELINES.md` — `src/api/` layout, adapter pattern, "never configure axios from UI" rule.
- `src/web-app/STATE_MANAGEMENT_REDUX_ARCHITECTURE.md` — slice / typed-hook rules; "do not import `useDispatch`/`useSelector` directly" rule.
- `src/web-app/INSTALLATION_GUIDE.md` — `npm install --legacy-peer-deps` is mandatory.
- `src/services/quiz-service/RESPONSE_WRAPPER_USAGE.md` — concrete `ApiResponse`/`PagedResponse`/exception patterns; copy this style when adding a new service.
- `src/services/quiz-service/MOCK_DATA_GUIDE.md` — how mock data is wired into the quiz service.
- `documentation/OBSERVABILITY_LGTM_GUIDE.md` — required setup before Prometheus/traces flow (also see the "Observability" section above).
