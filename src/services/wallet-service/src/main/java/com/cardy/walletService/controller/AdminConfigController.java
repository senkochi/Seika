package com.cardy.walletService.controller;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.dto.admin.UpdateConfigRequest;
import com.cardy.walletService.entity.SystemConfig;
import com.cardy.walletService.repository.WalletRepository;
import com.cardy.walletService.service.SystemConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminConfigController {

    private final SystemConfigService systemConfigService;
    private final WalletRepository walletRepository;

    @GetMapping("/configs")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<SystemConfig>> listConfigs() {
        return ResponseEntity.ok(systemConfigService.getAll());
    }

    @GetMapping("/configs/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemConfig> getConfig(@PathVariable String key) {
        SystemConfig config = systemConfigService.getAll().stream()
                .filter(c -> key.equals(c.getKey()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Config không tồn tại: " + key));
        return ResponseEntity.ok(config);
    }

    @PutMapping("/configs/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemConfig> updateConfig(
            @PathVariable String key,
            @Valid @RequestBody UpdateConfigRequest request) {
        String updatedBy = resolveUserId();
        log.info("Admin update config {} = {} by {}", key, request.getValue(), updatedBy);
        return ResponseEntity.ok(systemConfigService.update(key, request.getValue(), updatedBy));
    }

    @GetMapping("/total-circulation")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, BigDecimal>> totalCirculation() {
        BigDecimal total = walletRepository.findAll().stream()
                .map(Wallet::getBalance)
                .filter(java.util.Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return ResponseEntity.ok(Map.of("totalCirculation", total));
    }

    private String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null || auth.getPrincipal() == null ? "unknown" : auth.getPrincipal().toString();
    }
}