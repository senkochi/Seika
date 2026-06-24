package com.seika.marketplace_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductType;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByActiveTrueOrderByCreatedAtDesc();

    List<Product> findByActiveTrueAndTypeOrderByCreatedAtDesc(ProductType type);

    Optional<Product> findByIdAndActiveTrue(String id);

    boolean existsByReferenceIdAndType(String referenceId, ProductType type);
}
