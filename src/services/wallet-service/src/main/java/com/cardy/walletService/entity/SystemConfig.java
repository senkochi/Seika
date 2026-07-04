package com.cardy.walletService.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "system_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SystemConfig {
    @Id
    @Column(name = "config_key", length = 100)
    String key;

    @Column(name = "config_value", nullable = false, length = 500)
    String value;

    @Column(length = 500)
    String description;

    @UpdateTimestamp
    @Column(name = "updated_at")
    Instant updatedAt;

    @Column(name = "updated_by", length = 100)
    String updatedBy;
}