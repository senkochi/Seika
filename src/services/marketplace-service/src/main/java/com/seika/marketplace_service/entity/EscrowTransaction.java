package com.seika.marketplace_service.entity;

import com.seika.marketplace_service.enums.EscrowStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.enums.TeacherTier;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "escrow_transactions",
        indexes = {
                @Index(name = "idx_escrows_order_id", columnList = "order_id"),
                @Index(name = "idx_escrows_order_item_id", columnList = "order_item_id"),
                @Index(name = "idx_escrows_buyer_id", columnList = "buyer_id"),
                @Index(name = "idx_escrows_seller_id", columnList = "seller_id"),
                @Index(name = "idx_escrows_status_release", columnList = "status, release_at")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EscrowTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "order_id", nullable = false)
    String orderId;

    @Column(name = "order_item_id", nullable = false, unique = true)
    String orderItemId;

    @Column(name = "buyer_id", nullable = false)
    String buyerId;

    @Column(name = "seller_id", nullable = false)
    String sellerId;

    @Column(name = "product_id", nullable = false)
    String productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 32)
    ProductType productType;

    @Column(name = "gross_amount", nullable = false, precision = 19, scale = 2)
    BigDecimal grossAmount;

    @Column(name = "bonus_backed_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    BigDecimal bonusBackedAmount = BigDecimal.ZERO;

    @Column(name = "reward_backed_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    BigDecimal rewardBackedAmount = BigDecimal.ZERO;

    @Column(name = "paid_backed_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    BigDecimal paidBackedAmount = BigDecimal.ZERO;

    @Column(name = "earned_promo_backed_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    BigDecimal earnedPromoBackedAmount = BigDecimal.ZERO;

    @Column(name = "promo_backed_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    BigDecimal promoBackedAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier_at_release", length = 32)
    TeacherTier tierAtRelease;

    @Column(name = "tier_fee_percent", precision = 8, scale = 2)
    BigDecimal tierFeePercent;

    @Column(name = "escrow_fee_percent", precision = 8, scale = 2)
    BigDecimal escrowFeePercent;

    @Column(name = "teacher_withdrawable_net", precision = 19, scale = 2)
    BigDecimal teacherWithdrawableNet;

    @Column(name = "teacher_promo_net", precision = 19, scale = 2)
    BigDecimal teacherPromoNet;

    @Column(name = "platform_fee_real", precision = 19, scale = 2)
    BigDecimal platformFeeReal;

    @Column(name = "platform_fee_promo_sink", precision = 19, scale = 2)
    BigDecimal platformFeePromoSink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    EscrowStatus status = EscrowStatus.HELD;

    @Column(name = "needs_admin_decision", nullable = false)
    @Builder.Default
    boolean needsAdminDecision = false;

    @Column(name = "review_reason", length = 500)
    String reviewReason;

    @Column(name = "release_at", nullable = false)
    Instant releaseAt;

    @Column(name = "credit_requested_at")
    Instant creditRequestedAt;

    @Column(name = "refund_requested_at")
    Instant refundRequestedAt;

    @Column(name = "released_at")
    Instant releasedAt;

    @Column(name = "refunded_at")
    Instant refundedAt;

    @Column(name = "last_wallet_error", length = 1000)
    String lastWalletError;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    Instant updatedAt;
}
