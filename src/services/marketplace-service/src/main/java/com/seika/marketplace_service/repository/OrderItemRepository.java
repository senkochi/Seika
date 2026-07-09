package com.seika.marketplace_service.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.EscrowState;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    List<OrderItem> findByOrderId(String orderId);
    List<OrderItem> findByProductIdAndEscrowStateIn(String productId, List<EscrowState> escrowStates);
    boolean existsByProductIdAndEscrowStateInAndEscrowFullyRefundedFalse(String productId, List<EscrowState> escrowStates);

    // -------------------------------------------------------------------------
    // Teacher statistics queries
    // -------------------------------------------------------------------------

    /**
     * Top products sold to students of a given seller, optionally filtered by
     * product type. Returns rows of {@code [productId, productType, productName,
     * totalSold, totalRevenue, unitPrice]}. Sorted by total sold desc.
     */
    @Query("""
            SELECT oi.productId            AS productId,
                   oi.productType          AS productType,
                   oi.productName          AS productName,
                   oi.unitPrice            AS unitPrice,
                   SUM(oi.quantity)        AS totalSold,
                   SUM(oi.totalPrice)      AS totalRevenue
            FROM OrderItem oi
            WHERE oi.sellerUserId = :sellerUserId
              AND (:productType IS NULL OR oi.productType = :productType)
            GROUP BY oi.productId, oi.productType, oi.productName, oi.unitPrice
            ORDER BY SUM(oi.quantity) DESC
            """)
    List<TopProductProjection> findTopProductsBySeller(@Param("sellerUserId") String sellerUserId,
                                                       @Param("productType") String productType,
                                                       Pageable pageable);

    /**
     * Aggregated revenue grouped by month for the supplied seller. Used to
     * render the time-series chart on the teacher Statistics page.
     */
    @Query("""
            SELECT TO_CHAR(o.createdAt, 'YYYY-MM') AS period,
                   SUM(oi.totalPrice)              AS totalRevenue,
                   COUNT(DISTINCT o.id)            AS orderCount
            FROM OrderItem oi
            JOIN Order o ON oi.orderId = o.id
            WHERE oi.sellerUserId = :sellerUserId
              AND o.status = com.seika.marketplace_service.enums.OrderStatus.PAID
            GROUP BY TO_CHAR(o.createdAt, 'YYYY-MM')
            ORDER BY period ASC
            """)
    List<RevenuePointProjection> findMonthlyRevenueBySeller(@Param("sellerUserId") String sellerUserId);

    /**
     * Aggregated revenue grouped by day for the supplied seller over the last
     * {@code days} days. Used when the teacher toggles the chart to "Daily".
     */
    @Query(value = """
            SELECT TO_CHAR(o.created_at, 'YYYY-MM-DD') AS period,
                   SUM(oi.total_price)                 AS total_revenue,
                   COUNT(DISTINCT o.id)                AS order_count
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.seller_user_id = :sellerUserId
              AND o.status = 'PAID'
              AND o.created_at >= (CURRENT_TIMESTAMP - (:days || ' days')::interval)
            GROUP BY TO_CHAR(o.created_at, 'YYYY-MM-DD')
            ORDER BY period ASC
            """, nativeQuery = true)
    List<RevenuePointProjection> findDailyRevenueBySeller(@Param("sellerUserId") String sellerUserId,
                                                          @Param("days") int days);

    /**
     * Distinct list of students who have bought at least one product from this
     * seller, enriched with the most recent purchase info.
     */
    @Query("""
            SELECT o.userId           AS userId,
                   oi.productId       AS productId,
                   oi.productType     AS productType,
                   oi.productName     AS productName,
                   oi.unitPrice       AS unitPrice,
                   o.createdAt        AS purchasedAt
            FROM OrderItem oi
            JOIN Order o ON oi.orderId = o.id
            WHERE oi.sellerUserId = :sellerUserId
              AND o.status = com.seika.marketplace_service.enums.OrderStatus.PAID
            ORDER BY o.createdAt DESC
            """)
    List<StudentPurchaseProjection> findStudentsBySeller(@Param("sellerUserId") String sellerUserId,
                                                         Pageable pageable);

    // -------------------------------------------------------------------------
    // Projection interfaces (read-only result mappings)
    // -------------------------------------------------------------------------

    interface TopProductProjection {
        String getProductId();
        String getProductType();
        String getProductName();
        java.math.BigDecimal getUnitPrice();
        Long getTotalSold();
        java.math.BigDecimal getTotalRevenue();
    }

    interface RevenuePointProjection {
        String getPeriod();
        java.math.BigDecimal getTotalRevenue();
        Long getOrderCount();
    }

    interface StudentPurchaseProjection {
        String getUserId();
        String getProductId();
        String getProductType();
        String getProductName();
        java.math.BigDecimal getUnitPrice();
        java.time.Instant getPurchasedAt();
    }
}
