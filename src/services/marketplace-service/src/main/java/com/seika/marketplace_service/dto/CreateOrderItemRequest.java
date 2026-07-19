package com.seika.marketplace_service.dto;

import lombok.*;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderItemRequest {
    @NotBlank(message = "productId is required")
    private String productId;
    private String productType;
    private String referenceId;
    private String productName;
    private BigDecimal unitPrice;
    @NotNull(message = "quantity is required")
    @Min(value = 1, message = "quantity must be positive")
    private Integer quantity;
    private String sellerUserId;
}
