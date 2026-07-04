package com.seika.marketplace_service.dto;

import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderItemRequest {
    private String productId;
    private String productType;
    private String referenceId;
    private String productName;
    private BigDecimal unitPrice;
    private Integer quantity;
    private String sellerUserId;
}
