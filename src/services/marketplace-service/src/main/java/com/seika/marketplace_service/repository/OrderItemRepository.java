package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

import com.seika.marketplace_service.entity.OrderItem;

public interface OrderItemRepository extends JpaRepository<OrderItem, String> {
    List<OrderItem> findByOrderId(String orderId);
}
