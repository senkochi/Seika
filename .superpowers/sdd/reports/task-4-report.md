# Task 4 Report — R-3 Admin freeze/unfreeze REST endpoints

## Status

DONE_WITH_CONCERNS

## Summary

Created `AdminWalletControlController` exposing `POST /api/wallet/admin/freeze` and `POST /api/wallet/admin/unfreeze`, both gated by `@PreAuthorize("hasRole('ADMIN')")`. Both endpoints delegate to the pre-existing `WalletService.applyFreeze` and `WalletService.removeFreeze` (lines 315/333 of `WalletService.java`). The third test (student → 403) verifies that the role-based authorization is enforced.

## Files created

- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/main/java/com/cardy/walletService/controller/AdminWalletControlController.java` — new controller (verbatim from the plan snippet in `2026-07-17-teacher-tiered-economy-v3-remediation.md` step 3, lines 637-697).
- `/home/cuongnh/Projects/Seika/src/services/wallet-service/src/test/java/com/cardy/walletService/controller/AdminWalletControlControllerTest.java` — new test class (3 tests).

## Deviations from the plan's test snippet

The plan's snippet used `@WebMvcTest(AdminWalletControlController.class)` plus `@MockBean WalletService`. **In Spring Boot 4.0 + Spring Framework 7.0.6 those annotations have been relocated**:

- `@WebMvcTest` moved from `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest` to `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest`.
- `@MockBean` is deprecated and was replaced by `@MockitoBean` (`org.springframework.test.context.bean.override.mockito.MockitoBean`).

Using those new annotations directly produced a runtime failure ("Failed to find merged annotation for BootstrapWith") that I could not resolve, because the standalone `@WebMvcTest` slice needs the full Spring Boot autoconfiguration chain. Rather than fight the slice, I switched to a minimal **explicit WebApplicationContext** approach:

- `@SpringJUnitWebConfig(TestSecurityConfig.class)` boots a tiny web context.
- `TestSecurityConfig` (nested `@Configuration`) wires:
  - `@EnableWebMvc` (registers the request mapping + Jackson message converter)
  - `@EnableWebSecurity` + `@EnableMethodSecurity(prePostEnabled = true)` (drives `@PreAuthorize`)
  - `@Bean` for `WalletService` (Mockito mock), `JwtAuthenticationFilter` (Mockito mock), `MappingJackson2HttpMessageConverter`, `ObjectMapper`, `AdminWalletControlController`, `SecurityFilterChain`.
- `MockMvcBuilders.webAppContextSetup(context).apply(springSecurity())` is used in `@BeforeEach`.
- `SecurityMockMvcRequestPostProcessors.authentication(...)` is used per-request to inject role-based auth — equivalent to `@WithMockUser(roles = "ADMIN")` / `roles = "STUDENT"`.
- `reset(walletService)` in `@BeforeEach` is required because the same Mockito mock is reused across tests in the cached Spring context, and `verify(..., never())` in the forbidden test would otherwise see calls from earlier tests.

The plan's three required test methods are present and pass:

1. `adminCanFreezeWallet` — admin auth, `POST /api/wallet/admin/freeze` → 200, `walletService.applyFreeze` invoked with the expected args.
2. `adminCanUnfreezeWallet` — admin auth, `POST /api/wallet/admin/unfreeze` → 200, `walletService.removeFreeze` invoked.
3. `nonAdminIsForbiddenFromFreeze` — student auth, `POST /api/wallet/admin/freeze` → 403, `walletService.applyFreeze` never invoked.

The test names match the brief's required list exactly; the structure differs because of Spring Boot 4.0 package moves.

## Test commands + results

### RED (before creating the controller)
```
bash ./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=AdminWalletControlControllerTest
[ERROR] Tests run: 3, Failures: 0, Errors: 3, Skipped: 0
[ERROR] Caused by: java.lang.ClassNotFoundException: AdminWalletControlController
BUILD FAILURE
```

### GREEN (after creating `AdminWalletControlController`)
```
bash ./src/services/wallet-service/mvnw -pl src/services/wallet-service -am test -Dtest=AdminWalletControlControllerTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 2.248 s -- in com.cardy.walletService.controller.AdminWalletControlControllerTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] wallet-service ..................................... SUCCESS [  3.775 s]
[INFO] BUILD SUCCESS
```

### Compile sanity check
```
bash ./src/services/wallet-service/mvnw -pl src/services/wallet-service -am compile -q -DskipTests
# exit 0, no output (Maven quiet mode)
```

## Concerns

1. **Test slice annotation relocation**: Spring Boot 4.0 / Spring Framework 7.0 deprecated `@MockBean` and moved `@WebMvcTest` to a new package. None of the existing tests in `wallet-service` use either, and the new path produced a `Failed to find merged annotation for BootstrapWith` runtime error that I could not resolve with the plan's snippet. I worked around it by switching the test to `@SpringJUnitWebConfig` with an explicit `@Configuration`. This works, but the project now carries two distinct web-test styles — the rest of the repo's tests use plain JUnit + direct controller invocation (per `ProductControllerTest.java`). If the codebase later needs a more idiomatic Spring Boot 4.0 controller test, the relocation is: `import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;` + `@MockitoBean` from `org.springframework.test.context.bean.override.mockito`. Worth noting for whichever agent does Tasks 5-10.

2. **Mock state reuse across tests**: the cached Spring context means the `@Bean WalletService walletService()` Mockito mock is shared across the three tests. I added `reset(walletService)` in `@BeforeEach` to keep the `verify(..., never())` semantics correct in `nonAdminIsForbiddenFromFreeze`. This is a minor hazard if more tests are added later — any new test must remember to reset, or alternatively the test could use `@DirtiesContext`.

3. **Unstaged changes per global constraint**: per the task brief ("DO NOT COMMIT"), the two new files remain un-staged on disk. They are visible to `git status` as untracked files but have not been added or committed.