package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;

@Entity
@Table(
    name = "products",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_products_type_reference",
            columnNames = {"type", "reference_id"}
        )
    },
    indexes = {
        @Index(name = "idx_products_active", columnList = "active"),
        @Index(name = "idx_products_type", columnList = "type"),
        @Index(name = "idx_products_status", columnList = "status")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(nullable = false)
    private String name;
    private String description;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private ProductType type;

    @Column(name = "reference_id", nullable = false)
    private String referenceId;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "seller_user_id", nullable = false)
    private String sellerUserId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32, columnDefinition = "varchar(32) default 'PENDING_REVIEW'")
    @Builder.Default
    private ProductStatus status = ProductStatus.PENDING_REVIEW;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}