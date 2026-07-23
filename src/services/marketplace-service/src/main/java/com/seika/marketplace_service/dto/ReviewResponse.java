package com.seika.marketplace_service.dto;

import lombok.*;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewResponse {
    private String id;
    private String buyerId;
    private String sellerId;
    private String productId;
    private String orderId;
    private int rating;
    private String comment;
    private String status;
    private Instant createdAt;
}
