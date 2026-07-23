package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

import com.seika.marketplace_service.entity.InboxEvent;

public interface InboxEventRepository extends JpaRepository<InboxEvent, String> {

    @Modifying
    @Query(value = """
            INSERT INTO inbox
                (id, message_id, event_type, aggregate_id, payload, status, received_at, retry_count)
            VALUES
                (:id, :messageId, :eventType, :aggregateId, CAST(:payload AS jsonb),
                 'RECEIVED', CURRENT_TIMESTAMP, 0)
            ON CONFLICT (message_id) DO UPDATE
            SET event_type = EXCLUDED.event_type,
                aggregate_id = EXCLUDED.aggregate_id,
                payload = EXCLUDED.payload,
                status = 'RECEIVED',
                received_at = CURRENT_TIMESTAMP,
                processed_at = NULL,
                last_error = NULL
            WHERE inbox.status = 'FAILED'
            """, nativeQuery = true)
    int claimMessage(@Param("id") String id,
                     @Param("messageId") String messageId,
                     @Param("eventType") String eventType,
                     @Param("aggregateId") String aggregateId,
                     @Param("payload") String payload);
	Optional<InboxEvent> findByMessageId(String messageId);
}
