package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.SellerIdentityProjection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SellerIdentityProjectionRepository
        extends JpaRepository<SellerIdentityProjection, String> {
}
