package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "marketplace_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MarketplaceConfig {

    @Id
    @Column(name = "config_key", nullable = false, length = 128)
    private String key;

    @Column(name = "config_value", nullable = false, length = 2000)
    private String value;

    @Column(length = 500)
    private String description;

    @Column(name = "updated_by")
    private String updatedBy;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}
