package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

import com.seika.marketplace_service.enums.OutboxStatus;

@Entity
@Table(
    name = "outbox",
    indexes = {
        @Index(name = "idx_outbox_status", columnList = "status"),
        @Index(name = "idx_outbox_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OutboxEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "aggregate_type", nullable = false, length = 64)
    String aggregateType;

    @Column(name = "aggregate_id", nullable = false, length = 64)
    String aggregateId;

    @Column(name = "event_type", nullable = false, length = 128)
    String eventType;

    @Column(name = "payload", nullable = false)
    @JdbcTypeCode(SqlTypes.JSON)
    String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    OutboxStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @Column(name = "published_at")
    Instant publishedAt;

    @Column(name = "retry_count", nullable = false)
    int retryCount;

    @Column(name = "last_error", length = 2000)
    String lastError;
}
