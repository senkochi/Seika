package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(
    name = "admin_action_logs",
    indexes = {
        @Index(name = "idx_admin_action_logs_target", columnList = "target_type, target_id"),
        @Index(name = "idx_admin_action_logs_admin", columnList = "admin_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminActionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "admin_id", nullable = false)
    String adminId;

    @Column(name = "action_type", nullable = false, length = 64)
    String actionType;

    @Column(name = "target_type", nullable = false, length = 64)
    String targetType;

    @Column(name = "target_id", nullable = false)
    String targetId;

    @Column(length = 1000)
    String reason;

    @Column(length = 4000)
    String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    Instant createdAt;
}
