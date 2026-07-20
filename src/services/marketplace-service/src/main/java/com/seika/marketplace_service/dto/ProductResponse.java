package com.seika.marketplace_service.dto;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.enums.TeacherTier;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private String id;
    private String name;
    private String description;
    private BigDecimal price;
    private ProductType type;
    private String referenceId;
    private boolean active;
    private String sellerUserId;
    private ProductStatus status;
    private String rejectionReason;
    private String teacherDisplayName;
    private TeacherTier teacherTier;
    private BigDecimal teacherAverageRating;
    private long teacherValidReviewCount;
    private Instant createdAt;
    private Instant updatedAt;

    public static ProductResponse fromEntity(Product product) {
        if (product == null) {
            return null;
        }
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .price(product.getPrice())
                .type(product.getType())
                .referenceId(product.getReferenceId())
                .active(product.isActive())
                .sellerUserId(product.getSellerUserId())
                .status(product.getStatus())
                .rejectionReason(product.getRejectionReason())
                .teacherDisplayName(product.getTeacherDisplayName())
                .teacherTier(product.getTeacherTier())
                .teacherAverageRating(product.getTeacherAverageRating())
                .teacherValidReviewCount(product.getTeacherValidReviewCount())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
