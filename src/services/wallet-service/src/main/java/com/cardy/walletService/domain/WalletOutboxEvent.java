package com.cardy.walletService.domain;

import com.cardy.walletService.enums.WalletOutboxStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
    name = "wallet_outbox_events",
    indexes = {
        @Index(name = "idx_wallet_outbox_status", columnList = "status"),
        @Index(name = "idx_wallet_outbox_created_at", columnList = "created_at"),
        @Index(name = "idx_wallet_outbox_aggregate", columnList = "aggregate_type, aggregate_id"),
        @Index(name = "idx_wallet_outbox_status_next_attempt", columnList = "status, next_attempt_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletOutboxEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "aggregate_type", nullable = false, length = 64)
    private String aggregateType;

    @Column(name = "aggregate_id", nullable = false, length = 128)
    private String aggregateId;

    @Column(name = "event_type", nullable = false, length = 128)
    private String eventType;

    @Column(name = "payload", nullable = false, columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private WalletOutboxStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "retry_count", nullable = false)
    @Builder.Default
    private int retryCount = 0;

    @Column(name = "last_error", length = 2000)
    private String lastError;

    @Column(name = "claimed_at")
    private Instant claimedAt;

    @Column(name = "next_attempt_at")
    private Instant nextAttemptAt;
}
