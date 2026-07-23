package com.seika.identity_service.controller;

import com.seika.identity_service.dto.admin.AdminDashboardStatsResponse;
import com.seika.identity_service.dto.admin.ChangeRoleRequest;
import com.seika.identity_service.dto.admin.PublicIdentitySnapshotResponse;
import com.seika.identity_service.dto.admin.UserAdminResponse;
import com.seika.identity_service.service.AdminService;
import com.seika.identity_service.service.PublicIdentitySnapshotService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@Validated
public class AdminController {

    private final AdminService adminService;
    private final PublicIdentitySnapshotService publicIdentitySnapshotService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserAdminResponse>> listUsers(
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Admin list users role={} page={} size={}", role, page, size);
        return ResponseEntity.ok(adminService.listUsers(role, page, size));
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserAdminResponse> getUser(@PathVariable String userId) {
        return ResponseEntity.ok(adminService.getUser(userId));
    }

    @PostMapping("/users/public-identities/snapshot")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PublicIdentitySnapshotResponse> publishPublicIdentitySnapshot(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "100") @Min(1) @Max(500) int size) {
        log.info("Admin publish public identity snapshot page={} size={}", page, size);
        return ResponseEntity.ok(
                publicIdentitySnapshotService.publishPage(page, size));
    }

    @PostMapping("/users/{userId}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserAdminResponse> lockUser(@PathVariable String userId) {
        log.info("Admin lock user {}", userId);
        return ResponseEntity.ok(adminService.lockUser(userId));
    }

    @PostMapping("/users/{userId}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserAdminResponse> unlockUser(@PathVariable String userId) {
        log.info("Admin unlock user {}", userId);
        return ResponseEntity.ok(adminService.unlockUser(userId));
    }

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserAdminResponse> changeRole(
            @PathVariable String userId,
            @Valid @RequestBody ChangeRoleRequest request) {
        log.info("Admin change role for user {} to {}", userId, request.getRole());
        return ResponseEntity.ok(adminService.changeRole(userId, request));
    }

    @PostMapping("/users/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> resetPassword(@PathVariable String userId) {
        log.info("Admin reset password for user {}", userId);
        adminService.resetPassword(userId);
        return ResponseEntity.ok(Map.of(
                "message", "Mật khẩu đã được reset. Mật khẩu mới không khả dụng — user cần liên hệ admin qua kênh khác để nhận lại."
        ));
    }

    @GetMapping("/dashboard/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardStatsResponse> getDashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
}