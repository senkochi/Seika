package com.seika.quiz_service.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Local mirror of marketplace OrderItems for QUIZ_SET products.
 * Populated by {@code ContentPurchasedConsumer} which listens to
 * {@code marketplace.events / content.purchased} routing key.
 * Used by teacher Statistics endpoints to compute top-selling quiz sets and
 * total revenue without crossing service boundaries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "product_sales")
@CompoundIndex(name = "sales_product_teacher", def = "{'productId': 1, 'teacherUserId': 1}")
public class ProductSales {

    @Id
    private String id;

    @Indexed
    private String orderId;

    @Indexed
    private String buyerUserId;

    @Indexed
    private String teacherUserId;

    @Indexed
    private String productId;

    private String productType;

    private BigDecimal price;

    private Instant purchasedAt;
}