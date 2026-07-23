package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.admin.UpdateMarketplaceConfigRequest;
import com.seika.marketplace_service.entity.MarketplaceConfig;
import com.seika.marketplace_service.service.MarketplaceConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace/admin/configs")
@RequiredArgsConstructor
@Slf4j
public class AdminMarketplaceConfigController {

    private final MarketplaceConfigService marketplaceConfigService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MarketplaceConfig>> getAll() {
        return ResponseEntity.ok(marketplaceConfigService.getAll());
    }

    @PutMapping("/{key}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MarketplaceConfig> update(@PathVariable String key,
                                                    @Valid @RequestBody UpdateMarketplaceConfigRequest request) {
        log.info("Admin update marketplace config {}", key);
        return ResponseEntity.ok(marketplaceConfigService.update(key, request.getValue(), resolveUserId()));
    }

    private static String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() != null ? auth.getPrincipal().toString() : "system";
    }
}
