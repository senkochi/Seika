package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.seika.marketplace_service.entity.UserInventory;

import java.util.Optional;

public interface UserInventoryRepository extends JpaRepository<UserInventory, String> {
    boolean existsByUserIdAndProductId(String userId, String productId);
    boolean existsByUserIdAndProductIdAndActiveTrue(String userId, String productId);

    java.util.List<UserInventory> findByUserIdAndActiveTrue(String userId);
    Optional<UserInventory> findByUserIdAndProductId(String userId, String productId);
    Optional<UserInventory> findByUserIdAndProductIdAndActiveTrue(String userId, String productId);
    Optional<UserInventory> findByOrderIdAndProductIdAndActiveTrue(String orderId, String productId);
    java.util.List<UserInventory> findByProductIdIn(java.util.List<String> productIds);
}
