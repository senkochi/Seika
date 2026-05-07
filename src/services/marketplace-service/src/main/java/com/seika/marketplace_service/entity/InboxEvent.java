package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

import com.seika.marketplace_service.enums.InboxStatus;

@Entity
@Table(
    name = "inbox",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_inbox_message_id", columnNames = {"message_id"})
    },
    indexes = {
        @Index(name = "idx_inbox_status", columnList = "status"),
        @Index(name = "idx_inbox_received_at", columnList = "received_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "message_id", nullable = false, length = 64)
    String messageId;

    @Column(name = "event_type", nullable = false, length = 128)
    String eventType;

    @Column(name = "aggregate_id", length = 64)
    String aggregateId;

    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    InboxStatus status;

    @CreationTimestamp
    @Column(name = "received_at", nullable = false, updatable = false)
    Instant receivedAt;

    @Column(name = "processed_at")
    Instant processedAt;

    @Column(name = "retry_count", nullable = false)
    int retryCount;

    @Column(name = "last_error", length = 2000)
    String lastError;
}
