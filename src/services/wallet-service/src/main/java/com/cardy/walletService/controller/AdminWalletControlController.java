package com.cardy.walletService.controller;

import com.cardy.walletService.domain.Wallet;
import com.cardy.walletService.service.WalletService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/wallet/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminWalletControlController {

    private final WalletService walletService;

    public record FreezeRequest(@NotNull UUID userId, String reason) {}

    @PostMapping("/freeze")
    public ResponseEntity<Wallet> freeze(@Valid @RequestBody FreezeRequest req) {
        String adminId = resolveAdminId();
        log.info("Admin {} freezing wallet userId={} reason={}", adminId, req.userId(), req.reason());
        Wallet wallet = walletService.applyFreeze(req.userId(),
                req.reason() == null ? "admin_freeze" : req.reason(),
                null, adminId);
        return ResponseEntity.ok(wallet);
    }

    @PostMapping("/unfreeze")
    public ResponseEntity<Wallet> unfreeze(@Valid @RequestBody FreezeRequest req) {
        String adminId = resolveAdminId();
        log.info("Admin {} unfreezing wallet userId={} reason={}", adminId, req.userId(), req.reason());
        Wallet wallet = walletService.removeFreeze(req.userId(),
                req.reason() == null ? "admin_unfreeze" : req.reason(),
                adminId);
        return ResponseEntity.ok(wallet);
    }

    private String resolveAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            return "unknown";
        }
        Object principal = auth.getPrincipal();
        return principal == null ? auth.getName() : principal.toString();
    }
}