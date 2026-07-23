package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

import com.seika.marketplace_service.enums.OrderStatus;

@Entity
@Table(
    name = "orders",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_orders_user_request_key", columnNames = {"user_id", "request_key"})
    },
    indexes = {
        @Index(name = "idx_orders_user_id", columnList = "user_id"),
        @Index(name = "idx_orders_status", columnList = "status"),
        @Index(name = "idx_orders_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "user_id", nullable = false)
    String userId;

    @Column(name = "request_key", length = 128)
    String requestKey;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    OrderStatus status;

    @Column(name = "total_amount", nullable = false, precision = 19, scale = 2)
    BigDecimal totalAmount;

    @Column(name = "needs_admin_decision", nullable = false)
    @Builder.Default
    boolean needsAdminDecision = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;
}
