package com.seika.marketplace_service.dto;

import com.seika.marketplace_service.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItemResponse {
    private String id;
    private String userId;
    private String productId;
    private String productType;
    private String referenceId;
    private String orderId;
    private boolean active;
    private Instant acquiredAt;
    private Instant consumedAt;
    private Instant revokedAt;
    private String revocationReason;
    private Product product;
}
