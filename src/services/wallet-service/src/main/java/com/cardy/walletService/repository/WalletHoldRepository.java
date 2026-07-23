package com.cardy.walletService.repository;

import com.cardy.walletService.domain.WalletHold;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WalletHoldRepository extends JpaRepository<WalletHold, UUID> {
    List<WalletHold> findByUserIdAndActiveTrue(UUID userId);
    Optional<WalletHold> findByUserIdAndHoldTypeAndSourceFlagId(UUID userId, String holdType, String sourceFlagId);
}
