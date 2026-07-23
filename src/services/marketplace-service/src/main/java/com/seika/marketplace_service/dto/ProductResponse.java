package com.seika.marketplace_service.dto;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.enums.TeacherTier;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.regex.Pattern;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private static final Pattern UUID_PATTERN = Pattern.compile(
            "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$");

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
                .teacherDisplayName(recognizableDisplayName(product))
                .teacherTier(product.getTeacherTier())
                .teacherAverageRating(product.getTeacherAverageRating())
                .teacherValidReviewCount(product.getTeacherValidReviewCount())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private static String recognizableDisplayName(Product product) {
        String displayName = product.getTeacherDisplayName();
        if (displayName == null || displayName.isBlank()) {
            return null;
        }

        String normalized = displayName.trim();
        if (normalized.equals(product.getSellerUserId())
                || UUID_PATTERN.matcher(normalized).matches()) {
            return null;
        }
        return normalized;
    }
}
