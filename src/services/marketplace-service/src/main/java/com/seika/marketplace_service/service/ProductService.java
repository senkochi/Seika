package com.seika.marketplace_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.repository.ProductRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository productRepository;

    public List<Product> getActiveProducts() {
        return productRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    public List<Product> getActiveProductsByType(ProductType type) {
        return productRepository.findByActiveTrueAndTypeOrderByCreatedAtDesc(type);
    }

    public Optional<Product> getActiveProductById(String id) {
        return productRepository.findByIdAndActiveTrue(id);
    }
}
