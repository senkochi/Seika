package com.seika.marketplace_service.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

import com.seika.marketplace_service.enums.ProductType;

@Entity
@Table(
    name = "order_items",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_order_items_order_product",
            columnNames = {"order_id", "product_id"}
        )
    },
    indexes = {
        @Index(name = "idx_order_items_order_id", columnList = "order_id"),
        @Index(name = "idx_order_items_product_id", columnList = "product_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OrderItem {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;

    @Column(name = "order_id", nullable = false)
    String orderId;

    @Column(name = "product_id", nullable = false)
    String productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "product_type", nullable = false, length = 32)
    ProductType productType;

    @Column(name = "reference_id", nullable = false)
    String referenceId;

    @Column(name = "product_name", nullable = false, length = 255)
    String productName;

    @Column(name = "unit_price", nullable = false, precision = 19, scale = 2)
    BigDecimal unitPrice;

    @Column(nullable = false)
    int quantity;

    @Column(name = "total_price", nullable = false, precision = 19, scale = 2)
    BigDecimal totalPrice;
}
