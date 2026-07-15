# V3 Audit Cluster A — Infra Blockers Design

**Date:** 2026-07-15
**Status:** Approved (brainstorming session)
**Scope:** Resolve 3 P0 infrastructure blockers identified by `docs/implementation/teacher-tiered-economy-v3-audit.md` (2026-07-15).
**Out of scope:** All other audit clusters (B Wallet Freeze, C admin revenue-stats split, D frontend product detail/reviews/archive/delete, E wallet wording + tier badge, F self-service refund UI, G wallet holds UI, H risk-scan scheduled job, I outbox for wallet publishes, K cleanup, L remaining logic defects).

## Source documents

- Plan: `docs/ideas/teacher-tiered-economy-v3.md` (esp. §"API Surface" L671-681 + D16)
- Phase 1/2/3 impl docs: `docs/implementation/teacher-tiered-economy-v3-phase{1,2,3}-implementation.md`
- Audit findings: `docs/implementation/teacher-tiered-economy-v3-audit.md` items #A1, #A2, #A3 + §5.2 + §6.7

## Approach (X3 — 2 commits)

| Commit | Items | Scope |
| --- | --- | --- |
| **C1** Infrastructure config | Eureka flashcard + gateway marketplace route | 2 YAML edits, config-server only |
| **C2** Ledger rename | BE method/path + FE service method/path | 2 files (Java + TypeScript) |

## Item 1 — Eureka client config for flashcard-service

**File touched:** `src/config-service/src/main/resources/configs/flashcard-service.yaml`

Add the following block (only `eureka.client.service-url.defaultZone` is mandatory; the `instance` block mirrors wallet-service.yaml style for symmetry, not required for correctness):

```yaml
eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER_URL}
    instance:
      prefer-ip-address: true
      lease-renewal-interval-in-seconds: 10
      lease-expiration-duration-in-seconds: 30
```

**Rationale:** flashcard-service already depends on `spring-cloud-starter-netflix-eureka-client` (gateway uses `lb://FLASHCARD-SERVICE`). Without `defaultZone`, the client has nowhere to register, gateway cannot resolve.

**Out of scope:** Wallet, marketplace, identity, profile, notification, quiz, reward services already have Eureka config — leave untouched.

## Item 2 — Gateway route for `/api/marketplace/**`

**File touched:** `src/config-service/src/main/resources/configs/api-gateway.yaml`

Add the following route entry alongside the existing wallet/quiz/flashcard routes:

```yaml
- id: marketplace-service
  uri: lb://MARKETPLACE-SERVICE
  predicates:
    - Path=/api/marketplace/**
  filters:
    - StripPrefix=0
```

**Rationale:**
- Plan §"API Surface" exposes 11 marketplace public/user/admin endpoints under `/api/marketplace/**`; all need to be reachable via gateway port 8080.
- `StripPrefix=0` keeps the `/api/marketplace/...` prefix unchanged so marketplace controllers receive the same path they bind to.
- `lb://MARKETPLACE-SERVICE` requires Eureka registration (item 1 unblocks this transitively; marketplace-service already registers since it has Eureka config).
- `AuthenticationFilter` runs globally; no per-route `public-endpoints` whitelist change needed for this scope. Public listing will require JWT for this cluster (acceptable — explicit scope decision; whitelisting is a separate spec).

**Out of scope:** Reward-service route is intentionally absent — not yet wired in plan.

## Item 3 — Rename wallet admin ledger endpoint

### Backend

**File touched:** `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminRevenueController.java`

- Method `getSystemTransactions(@RequestParam String type)` (line ~29-35) → rename to `getLedger(@RequestParam String type)`.
- Annotation `@GetMapping("/transactions")` → `@GetMapping("/ledger")`.

Internal behavior preserved: still queries `wallet_ledger_entries` table, same DTO, same filter semantics, same `@PreAuthorize("hasRole('ADMIN')")`.

### Frontend

**Files touched (2):**
1. `src/web-app/src/api/services/admin.ts` — method `getSystemTransactions(type)` (line ~291) → rename to `getLedger(type)`; URL `/wallet/admin/transactions` → `/wallet/admin/ledger`.
2. `src/web-app/src/pages/admin/AdminRevenue.tsx` — call site `adminService.getSystemTransactions(type)` (line ~110 + ~258) → `adminService.getLedger(type)`. Render logic unchanged.

### Backward compatibility

**No alias kept.** Old URL `/wallet/admin/transactions` returns 404. Audit confirms only web-app calls this endpoint — no SDK, no external client. Acceptable for zero blast radius. If a rollback is needed, the rename is one revert away.

## Testing & verification

### C1 (Eureka + gateway)

**Manual verification (must pass before merge):**
1. `docker compose up -d --build flashcard-service config-service`
2. `curl -s http://localhost:8761/eureka/apps | grep -i flashcard` → expect `FLASHCARD-SERVICE` listed.
3. `curl -s http://localhost:8080/api/marketplace/products` → expect 401 (auth required) or 200 with JWT. Path forwarded → `MARKETPLACE-SERVICE` registered and reachable.
4. `curl -s http://localhost:8080/api/marketplace/does-not-exist` → expect 404 from marketplace-service.
5. Verify gateway route resolution with `curl http://localhost:8080/api/flashcards` → expect 200 (existing flashcard route still works).

### C2 (Ledger rename)

**Compile + typecheck (must pass):**
- Backend: `./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests`
- Frontend: `cd src/web-app && npm run typecheck && npm run lint`

**End-to-end manual verification:**
1. Log in as ADMIN user.
2. Navigate to `/admin/dashboard/revenue`.
3. Switch to "Ledger" tab → rows load (calls `/wallet/admin/ledger`).
4. Filter dropdown narrows rows correctly.
5. Negative test: `curl -X GET http://localhost:8084/api/wallet/admin/transactions` (with admin JWT) → expect 404 (confirms rename complete).

**Test scaffolding is intentionally out of scope** for this cluster (no MockMvc controller test, no service-level test). Rationale: 3 items are pure config + rename; existing project test convention does not cover gateway routing paths, and adding infrastructure test scaffolding should be a separate spec.

## Files changed

| File | Change |
| --- | --- |
| `src/config-service/src/main/resources/configs/flashcard-service.yaml` | +eureka block |
| `src/config-service/src/main/resources/configs/api-gateway.yaml` | +marketplace-service route |
| `src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminRevenueController.java` | rename method + @GetMapping path |
| `src/web-app/src/api/services/admin.ts` | rename service method + URL |
| `src/web-app/src/pages/admin/AdminRevenue.tsx` | update call site |

## Non-goals

- No new tests written.
- No `wallet.ts` `getHistory` POST→GET fix (separate audit item).
- No whitelisting of marketplace public routes in gateway's `public-endpoints`.
- No integration of C1+C2 commits into a single atomic PR.
- No public-endpoint whitelist for `GET /api/marketplace/products` (still requires JWT after this spec lands).

## Risks

| Risk | Mitigation |
| --- | --- |
| Eureka env var `EUREKA_SERVER_URL` missing in dev compose | Already present in `.env` (per `CLAUDE.md`). C1 verification curl at startup catches. |
| Gateway reload requires config-service restart | docker compose restart config-service first then api-gateway, per existing workflow. |
| Ledger rename breaks any 3rd-party caller we forgot | Audit scope is web-app only. If a non-web caller exists in future, will be caught by negative curl in verification. |

## Implementation plan

After spec approval, invoke `superpowers:writing-plans` to produce a step-by-step plan with subagent-driven development tasks. Plan will produce 2 PRs (one per commit) with verification steps.
