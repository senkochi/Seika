package com.seika.marketplace_service.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateReviewRequest {
    @NotBlank
    private String productId;

    @Min(1)
    @Max(5)
    private int rating;

    private String comment;
}
