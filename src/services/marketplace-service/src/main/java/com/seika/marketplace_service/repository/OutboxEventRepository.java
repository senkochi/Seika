package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.time.Instant;

import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OutboxStatus;

public interface OutboxEventRepository extends JpaRepository<OutboxEvent, String> {
	List<OutboxEvent> findTop50ByStatusInOrderByCreatedAtAsc(List<OutboxStatus> statuses);

    @Query(value = """
            SELECT * FROM outbox
            WHERE status IN ('PENDING', 'FAILED')
              AND (next_attempt_at IS NULL OR next_attempt_at <= :now)
            ORDER BY created_at ASC
            LIMIT :batchSize
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<OutboxEvent> claimNextPendingBatch(@Param("batchSize") int batchSize,
                                            @Param("now") Instant now);
}
