package com.seika.marketplace_service.entity;

import com.seika.marketplace_service.enums.ReviewStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(
        name = "reviews",
        uniqueConstraints = @UniqueConstraint(name = "uk_reviews_buyer_product", columnNames = {"buyer_id", "product_id"}),
        indexes = {
                @Index(name = "idx_reviews_seller_id", columnList = "seller_id"),
                @Index(name = "idx_reviews_product_id", columnList = "product_id"),
                @Index(name = "idx_reviews_status", columnList = "status")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Review {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "buyer_id", nullable = false)
    String buyerId;

    @Column(name = "seller_id", nullable = false)
    String sellerId;

    @Column(name = "product_id", nullable = false)
    String productId;

    @Column(name = "order_id", nullable = false)
    String orderId;

    @Column(nullable = false)
    int rating;

    @Column(length = 2000)
    String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    ReviewStatus status = ReviewStatus.VALID;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    Instant updatedAt;
}
