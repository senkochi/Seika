package com.cardy.walletService.service;

import com.cardy.walletService.domain.WalletHold;
import com.cardy.walletService.repository.WalletHoldRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletHoldService {

    private final WalletHoldRepository walletHoldRepository;

    @Transactional(readOnly = true)
    public boolean canCashOut(UUID userId) {
        List<WalletHold> activeHolds = walletHoldRepository.findByUserIdAndActiveTrue(userId);
        LocalDateTime now = LocalDateTime.now();
        for (WalletHold hold : activeHolds) {
            if (hold.getExpiresAt() == null || hold.getExpiresAt().isAfter(now)) {
                return false;
            }
        }
        return true;
    }

    @Transactional(readOnly = true)
    public List<WalletHold> getActiveHolds(UUID userId) {
        LocalDateTime now = LocalDateTime.now();
        return walletHoldRepository.findByUserIdAndActiveTrue(userId).stream()
                .filter(hold -> hold.getExpiresAt() == null || hold.getExpiresAt().isAfter(now))
                .toList();
    }

    @Transactional
    public WalletHold placeHold(UUID userId, String holdType, String reason,
                                String sourceFlagId, String createdBy, LocalDateTime expiresAt) {
        if (sourceFlagId != null) {
            Optional<WalletHold> existing = walletHoldRepository
                    .findByUserIdAndHoldTypeAndSourceFlagId(userId, holdType, sourceFlagId);
            if (existing.isPresent()) {
                log.info("Idempotent hold check: hold already exists for user {} flag {}", userId, sourceFlagId);
                return existing.get();
            }
        }

        WalletHold hold = WalletHold.builder()
                .userId(userId)
                .holdType(holdType)
                .reason(reason)
                .sourceFlagId(sourceFlagId)
                .createdBy(createdBy)
                .expiresAt(expiresAt)
                .active(true)
                .build();
        return walletHoldRepository.save(hold);
    }
}
