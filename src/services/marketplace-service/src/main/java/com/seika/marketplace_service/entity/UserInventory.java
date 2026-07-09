package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

import com.seika.marketplace_service.enums.ProductType;

@Entity
@Table(
    name = "user_inventory",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_user_inventory_user_product",
            columnNames = {"user_id", "product_id"}
        )
    },
    indexes = {
        @Index(name = "idx_user_inventory_user_id", columnList = "user_id"),
        @Index(name = "idx_user_inventory_product_id", columnList = "product_id"),
        @Index(name = "idx_user_inventory_active", columnList = "active")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserInventory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "user_id", nullable = false)
    String userId;

    @Column(name = "product_id", nullable = false)
    String productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 32)
    ProductType productType;

    @Column(name = "reference_id", nullable = false)
    String referenceId;

    @Column(name = "order_id", nullable = false)
    String orderId;

    @Column(nullable = false)
    boolean active = true;

    @CreationTimestamp
    @Column(name = "acquired_at", nullable = false, updatable = false)
    Instant acquiredAt;

    @Column(name = "revoked_at")
    Instant revokedAt;

    @Column(name = "consumed_at")
    Instant consumedAt;

    @Column(name = "revocation_reason", length = 500)
    String revocationReason;

    @Column(name = "source_order_id")
    String sourceOrderId;
}
