package com.cardy.walletService.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "wallets", check = @CheckConstraint(constraint = "balance >= 0"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false)
    @Builder.Default
    private BigDecimal balance = BigDecimal.ZERO;

    @Column(name = "bonus_balance", nullable = false)
    @Builder.Default
    private BigDecimal bonusBalance = BigDecimal.ZERO;

    @Column(name = "reward_balance", nullable = false)
    @Builder.Default
    private BigDecimal rewardBalance = BigDecimal.ZERO;

    @Column(name = "paid_balance", nullable = false)
    @Builder.Default
    private BigDecimal paidBalance = BigDecimal.ZERO;

    @Column(name = "earned_withdrawable_balance", nullable = false)
    @Builder.Default
    private BigDecimal earnedWithdrawableBalance = BigDecimal.ZERO;

    @Column(name = "earned_promo_balance", nullable = false)
    @Builder.Default
    private BigDecimal earnedPromoBalance = BigDecimal.ZERO;

    @Column(name = "held_balance", nullable = false)
    @Builder.Default
    private BigDecimal heldBalance = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean frozen = false;

    @UpdateTimestamp
    @Column(name = "update_at")
    private LocalDateTime updateAt;

    public void recalculateBalance() {
        this.bonusBalance = zeroIfNull(this.bonusBalance);
        this.rewardBalance = zeroIfNull(this.rewardBalance);
        this.paidBalance = zeroIfNull(this.paidBalance);
        this.earnedWithdrawableBalance = zeroIfNull(this.earnedWithdrawableBalance);
        this.earnedPromoBalance = zeroIfNull(this.earnedPromoBalance);
        this.heldBalance = zeroIfNull(this.heldBalance);
        this.balance = bonusBalance
                .add(rewardBalance)
                .add(paidBalance)
                .add(earnedWithdrawableBalance)
                .add(earnedPromoBalance);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
