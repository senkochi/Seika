package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.seika.marketplace_service.entity.UserInventory;

public interface UserInventoryRepository extends JpaRepository<UserInventory, String> {
	boolean existsByUserIdAndProductId(String userId, String productId);

	java.util.List<UserInventory> findByUserIdAndActiveTrue(String userId);
}
