package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.seika.marketplace_service.entity.Order;

public interface OrderRepository extends JpaRepository<Order, String> {
}
