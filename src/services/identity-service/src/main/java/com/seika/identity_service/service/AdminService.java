package com.seika.identity_service.service;

import com.seika.identity_service.dto.admin.AdminDashboardStatsResponse;
import com.seika.identity_service.dto.admin.ChangeRoleRequest;
import com.seika.identity_service.dto.admin.UserAdminResponse;
import com.seika.identity_service.entity.Role;
import com.seika.identity_service.entity.User;
import com.seika.identity_service.repository.RoleRepository;
import com.seika.identity_service.repository.UserRepository;
import com.seika.identity_service.repository.httpclient.MarketplaceClient;
import com.seika.identity_service.repository.httpclient.WalletClient;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    public static final String ROLE_ADMIN = "ADMIN";
    public static final String ROLE_TEACHER = "TEACHER";
    public static final String ROLE_STUDENT = "STUDENT";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final WalletClient walletClient;
    private final MarketplaceClient marketplaceClient;

    @Transactional(readOnly = true)
    public Page<UserAdminResponse> listUsers(String role, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("username").ascending());
        Page<User> users = (role == null || role.isBlank())
                ? userRepository.findAll(pageable)
                : userRepository.findByRoles_Name(role.toUpperCase(), pageable);
        return users.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public UserAdminResponse getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + userId));
        return toResponse(user);
    }

    @Transactional
    public UserAdminResponse lockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + userId));
        if (userHasRole(user, ROLE_ADMIN)) {
            throw new IllegalArgumentException("Không thể khóa tài khoản ADMIN");
        }
        user.setEnabled(false);
        userRepository.save(user);
        log.info("Locked user {}", user.getUsername());
        return toResponse(user);
    }

    @Transactional
    public UserAdminResponse unlockUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + userId));
        user.setEnabled(true);
        userRepository.save(user);
        log.info("Unlocked user {}", user.getUsername());
        return toResponse(user);
    }

    @Transactional
    public UserAdminResponse changeRole(String userId, ChangeRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + userId));
        if (userHasRole(user, ROLE_ADMIN)) {
            throw new IllegalArgumentException("Không thể đổi role của tài khoản ADMIN");
        }

        String newRoleName = request.getRole().toUpperCase();
        Role newRole = roleRepository.findById(newRoleName)
                .orElseThrow(() -> new IllegalStateException("Role không tồn tại: " + newRoleName));

        // Xóa role cũ (STUDENT/TEACHER), giữ role khác (nếu có) — ở đây chỉ có STUDENT hoặc TEACHER
        Set<Role> updatedRoles = user.getRoles().stream()
                .filter(r -> !r.getName().equals(ROLE_STUDENT) && !r.getName().equals(ROLE_TEACHER))
                .collect(Collectors.toSet());
        updatedRoles.add(newRole);

        user.setRoles(updatedRoles);
        userRepository.save(user);
        log.info("Changed role of {} to {}", user.getUsername(), newRoleName);
        return toResponse(user);
    }

    /**
     * Reset password thành một giá trị ngẫu nhiên không khả dụng.
     * User sẽ phải liên hệ admin qua kênh khác để được cấp lại.
     */
    @Transactional
    public void resetPassword(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User không tồn tại: " + userId));
        String randomPassword = UUID.randomUUID().toString();
        user.setPassword(passwordEncoder.encode(randomPassword));
        userRepository.save(user);
        log.info("Reset password for user {}", user.getUsername());
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats() {
        long totalTeachers = userRepository.countByRoles_Name(ROLE_TEACHER);
        long totalStudents = userRepository.countByRoles_Name(ROLE_STUDENT);
        long totalUsers = userRepository.count();
        long totalEnabled = userRepository.countByEnabled(true);
        long totalDisabled = userRepository.countByEnabled(false);

        long pendingProducts = -1L;
        try {
            Long count = marketplaceClient.countPendingProducts();
            pendingProducts = count == null ? 0L : count;
        } catch (FeignException e) {
            log.warn("Marketplace client lỗi khi countPendingProducts: status={}", e.status());
        } catch (Exception e) {
            log.warn("Marketplace client exception: {}", e.getMessage());
        }

        String totalCirculation = "0";
        try {
            String response = walletClient.getTotalCirculation();
            if (response != null && !response.isBlank()) {
                // Response có thể trả về JSON number (e.g. "1234.56") — strip quotes
                totalCirculation = response.replaceAll("\"", "").trim();
            }
        } catch (FeignException e) {
            log.warn("Wallet client lỗi khi getTotalCirculation: status={}", e.status());
        } catch (Exception e) {
            log.warn("Wallet client exception: {}", e.getMessage());
        }

        return AdminDashboardStatsResponse.builder()
                .totalTeachers(totalTeachers)
                .totalStudents(totalStudents)
                .totalUsers(totalUsers)
                .totalEnabledUsers(totalEnabled)
                .totalDisabledUsers(totalDisabled)
                .pendingProducts(pendingProducts)
                .totalCoinCirculation(totalCirculation)
                .build();
    }

    private UserAdminResponse toResponse(User user) {
        Set<String> roleNames = user.getRoles() == null
                ? Set.of()
                : user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        return UserAdminResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .roles(roleNames)
                .enabled(user.getEnabled() == null || user.getEnabled())
                .build();
    }

    private boolean userHasRole(User user, String roleName) {
        if (user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(r -> roleName.equals(r.getName()));
    }
}