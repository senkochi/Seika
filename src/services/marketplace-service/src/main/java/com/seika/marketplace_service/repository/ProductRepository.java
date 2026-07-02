package com.seika.marketplace_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;

public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByActiveTrueAndStatusOrderByCreatedAtDesc(ProductStatus status);

    List<Product> findByActiveTrueAndStatusAndTypeOrderByCreatedAtDesc(ProductStatus status, ProductType type);

    Optional<Product> findByIdAndActiveTrueAndStatus(String id, ProductStatus status);

    boolean existsByReferenceIdAndType(String referenceId, ProductType type);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    long countByStatus(ProductStatus status);
}