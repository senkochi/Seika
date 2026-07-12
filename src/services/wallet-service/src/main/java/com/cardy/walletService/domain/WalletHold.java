package com.cardy.walletService.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "wallet_holds",
    indexes = {
        @Index(name = "idx_wallet_holds_user_active", columnList = "user_id, active"),
        @Index(name = "idx_wallet_holds_source_flag", columnList = "source_flag_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletHold {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "hold_type", nullable = false, length = 32)
    private String holdType;

    @Column(length = 500)
    private String reason;

    @Column(name = "source_flag_id", length = 64)
    private String sourceFlagId;

    @Column(name = "created_by", length = 64)
    private String createdBy;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
