package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.PurchaseClaim;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseClaimRepository extends JpaRepository<PurchaseClaim, String> {
    List<PurchaseClaim> findByOrderId(String orderId);

    void deleteByOrderId(String orderId);
}
