package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.MarketplaceConfig;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MarketplaceConfigRepository extends JpaRepository<MarketplaceConfig, String> {
}
