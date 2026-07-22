package com.cardy.walletService.repository;

import com.cardy.walletService.domain.Wallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface WalletRepository extends JpaRepository<Wallet, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Wallet> findByUserId(UUID userId);

    @Query(value = """
            SELECT pg_advisory_xact_lock(hashtextextended(CAST(:userId AS text), 0))
            """, nativeQuery = true)
    void acquireUserLock(@Param("userId") String userId);
}
