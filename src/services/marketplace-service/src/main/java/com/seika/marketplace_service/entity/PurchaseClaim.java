package com.seika.marketplace_service.entity;

import com.seika.marketplace_service.enums.PurchaseClaimStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "purchase_claims",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_purchase_claim_user_product", columnNames = {"user_id", "product_id"})
        },
        indexes = {
                @Index(name = "idx_purchase_claim_order", columnList = "order_id"),
                @Index(name = "idx_purchase_claim_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PurchaseClaim {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "user_id", nullable = false)
    String userId;

    @Column(name = "product_id", nullable = false)
    String productId;

    @Column(name = "order_id", nullable = false)
    String orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    PurchaseClaimStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    Instant updatedAt;
}
