package com.cardy.walletService.domain;

import com.cardy.walletService.enums.WalletLedgerSource;
import com.cardy.walletService.enums.WalletLedgerType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "wallet_ledger_entries",
        indexes = {
                @Index(name = "idx_wallet_ledger_wallet_id", columnList = "wallet_id"),
                @Index(name = "idx_wallet_ledger_user_id", columnList = "user_id"),
                @Index(name = "idx_wallet_ledger_order_id", columnList = "order_id"),
                @Index(name = "idx_wallet_ledger_idempotency_key", columnList = "idempotency_key")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletLedgerEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "wallet_id", nullable = false)
    private Wallet wallet;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private WalletLedgerType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 64)
    private WalletLedgerSource source;

    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal amount;

    @Column(name = "withdrawable_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal withdrawableAmount = BigDecimal.ZERO;

    @Column(name = "non_withdrawable_amount", nullable = false, precision = 19, scale = 2)
    @Builder.Default
    private BigDecimal nonWithdrawableAmount = BigDecimal.ZERO;

    @Column(name = "amount_vnd", precision = 19, scale = 2)
    private BigDecimal amountVnd;

    @Column(name = "rate_vnd_per_coin", precision = 19, scale = 2)
    private BigDecimal rateVndPerCoin;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "order_item_id")
    private String orderItemId;

    @Column(name = "escrow_id")
    private String escrowId;

    @Column(name = "counterparty_user_id")
    private UUID counterpartyUserId;

    @Column(name = "idempotency_key")
    private String idempotencyKey;

    @Column(length = 1000)
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
