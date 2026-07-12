package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.enums.OrderStatus;

public interface OrderRepository extends JpaRepository<Order, String> {
    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END FROM Order o JOIN OrderItem oi ON o.id = oi.orderId WHERE o.userId = :userId AND oi.productId IN :productIds AND o.status IN :statuses")
    boolean existsByUserIdAndProductIdsAndStatuses(@Param("userId") String userId, @Param("productIds") List<String> productIds, @Param("statuses") List<OrderStatus> statuses);

    @Query("SELECT DISTINCT oi.productId FROM Order o JOIN OrderItem oi ON o.id = oi.orderId WHERE o.userId = :userId AND o.status IN :statuses")
    List<String> findProductIdsByUserIdAndStatuses(@Param("userId") String userId, @Param("statuses") List<OrderStatus> statuses);
}
