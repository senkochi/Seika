package com.cardy.walletService.repository;

import com.cardy.walletService.domain.WalletIdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WalletIdempotencyKeyRepository extends JpaRepository<WalletIdempotencyKey, String> {
}
