package com.cardy.walletService.controller;

import com.cardy.walletService.domain.WalletHold;
import com.cardy.walletService.service.WalletHoldService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet/holds")
@RequiredArgsConstructor
@Slf4j
public class WalletHoldController {

    private final WalletHoldService walletHoldService;

    @GetMapping("/me")
    public ResponseEntity<List<WalletHold>> getMyActiveHolds(@AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        return ResponseEntity.ok(walletHoldService.getActiveHolds(userId));
    }
}
