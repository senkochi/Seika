package com.seika.marketplace_service.dto;

import lombok.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrderRequest {
    @NotBlank(message = "userId is required")
    private String userId;

    @NotEmpty(message = "items cannot be empty")
    @Valid
    private List<CreateOrderItemRequest> items;
}
