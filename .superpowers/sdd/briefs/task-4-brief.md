# Task 4 — R-3 Admin freeze/unfreeze REST endpoints

## Where this fits

Task 4 of 10. Plan: `/home/cuongnh/Projects/Seika/docs/superpowers/plans/2026-07-17-teacher-tiered-economy-v3-remediation.md`. Tasks 1-3 are complete.

## Goal

Expose `WalletService.removeFreeze` (already implemented at line 333-349) and `WalletService.applyFreeze` (line 315-331) via REST endpoints so an admin can unfreeze a wallet that's stuck frozen after a `MALICIOUS` collusion event. Currently there is no controller route invoking `removeFreeze`.

## Read these files first

- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/service/WalletService.java` lines 315-349 — the freeze/unfreeze service methods (signatures: `applyFreeze(UUID, String, String, String)` and `removeFreeze(UUID, String, String)`, both return `Wallet`).
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/controller/WalletController.java` — confirm no freeze/unfreeze endpoint exists.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminRevenueController.java` — match the admin endpoint style (`@RequestMapping("/api/wallet/admin")` + `@PreAuthorize("hasRole('ADMIN')")`).
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminConfigController.java` — another admin pattern reference.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/security/SecurityConfig.java` — check whether `@WebMvcTest` will need security filter disabling or whether `@PreAuthorize` works in the slice.
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/domain/Wallet.java` — confirm `Wallet` is a JPA entity with `userId`, `frozen`, getters/setters.

## What R-3 is

The freeze mechanism exists (R-3's pair of methods) but is one-directional: `CollusionEventConsumer.handleCollusionFlaggedEvent` calls `walletService.applyFreeze(teacherId, reason, flagId, "SYSTEM_COLLUSION")` on `MALICIOUS` events. There's no public endpoint that calls `removeFreeze` — once frozen, the user is stuck until another collusion event re-triggers. The audit calls this out as Required.

## What the fix must do

Create a NEW file `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminWalletControlController.java` with:

```java
@RestController
@RequestMapping("/api/wallet/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminWalletControlController {

    private final WalletService walletService;

    public record FreezeRequest(@NotNull UUID userId, String reason) {}

    @PostMapping("/freeze")
    public ResponseEntity<Wallet> freeze(@Valid @RequestBody FreezeRequest req) { ... }

    @PostMapping("/unfreeze")
    public ResponseEntity<Wallet> unfreeze(@Valid @RequestBody FreezeRequest req) { ... }

    private String resolveAdminId() { ... }
}
```

(The brief's exact content in the plan is the canonical reference — use that. Resolve the admin identity via `SecurityContextHolder`; prefer the UUID from the principal if available, fallback to `auth.getName()`.)

## Required new test

Create `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/test/java/com/cardy/walletService/controller/AdminWalletControlControllerTest.java` with THREE test methods:

1. `adminCanFreezeWallet` — `@WithMockUser(roles = "ADMIN")`, POST `/api/wallet/admin/freeze` with `{userId, reason}` body → 200 OK, `walletService.applyFreeze` invoked.
2. `adminCanUnfreezeWallet` — `@WithMockUser(roles = "ADMIN")`, POST `/api/wallet/admin/unfreeze` with `{userId, reason}` body → 200 OK, `walletService.removeFreeze` invoked.
3. `nonAdminIsForbiddenFromFreeze` — `@WithMockUser(roles = "STUDENT")`, POST `/api/wallet/admin/freeze` → 403 Forbidden, `walletService.applyFreeze` NEVER invoked.

## Notes on test infrastructure

- Use `@WebMvcTest(AdminWalletControlController.class)`.
- `@MockBean WalletService walletService;`
- For the security filter, look at how existing tests in `wallet-service/src/test/.../controller/` handle it. If `JwtAuthenticationFilter` is registered as a `@Component`, you may need `@MockBean JwtAuthenticationFilter` to bypass it. Or use `@AutoConfigureMockMvc(addFilters = false)` — but that disables ALL security, so it can't verify the 403 case. Prefer the `@MockBean` route.
- Match the project's existing JUnit 5 + Mockito + AssertJ style.

## TDD / verify

```bash
# red: compile error (controller doesn't exist yet)
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=AdminWalletControlControllerTest

# green: after fix
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=AdminWalletControlControllerTest
# Expected: 3/3 pass (admin freeze, admin unfreeze, student forbidden)

# compile sanity
./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
```

## DO NOT COMMIT

Leave changes un-staged on disk.

## Required output

Write full report to `/home/cuongnh/Projects/Seika/.superpowers/sdd/reports/task-4-report.md`:
- Status: DONE / DONE_WITH_CONCERNS / NEEDS_CONTEXT / BLOCKED
- Files created (absolute paths)
- Test commands + exact result lines
- Note any deviation from the plan's controller snippet (e.g. if `Wallet.builder()` does not exist, document the workaround).
- Reply with: status, one-line test summary, concerns.