package com.cardy.walletService.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "wallet_idempotency_keys")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletIdempotencyKey {

    @Id
    @Column(name = "idempotency_key", nullable = false, length = 255)
    private String idempotencyKey;

    @Column(name = "order_id")
    private String orderId;

    @Column(name = "operation", nullable = false, length = 64)
    private String operation;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
