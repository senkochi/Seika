package com.cardy.walletService.repository;

import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletOutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface WalletOutboxEventRepository extends JpaRepository<WalletOutboxEvent, UUID> {
    List<WalletOutboxEvent> findTop50ByStatusInOrderByCreatedAtAsc(List<WalletOutboxStatus> statuses);

    /**
     * Atomically claim up to {@code batchSize} PENDING outbox rows whose next-attempt
     * time is due. Uses SELECT ... FOR UPDATE SKIP LOCKED so two scheduler
     * replicas/ticks cannot pick the same row and double-publish.
     *
     * The caller MUST be inside a transaction so the row locks are held until
     * the row is updated to CLAIMED/SENT/DEAD.
     */
    @Query(value = """
        SELECT * FROM wallet_outbox_events
        WHERE status = 'PENDING'
          AND (next_attempt_at IS NULL OR next_attempt_at <= :now)
        ORDER BY created_at ASC
        LIMIT :batchSize
        FOR UPDATE SKIP LOCKED
        """, nativeQuery = true)
    List<WalletOutboxEvent> claimNextPendingBatch(@Param("batchSize") int batchSize,
                                                  @Param("now") Instant now);
}
