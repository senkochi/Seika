package com.seika.marketplace_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository productRepository;
    private final UserInventoryRepository userInventoryRepository;

    public List<Product> getActiveProducts(String userId) {
        List<Product> products = productRepository.findByActiveTrueOrderByCreatedAtDesc();
        if (userId != null) {
            List<String> ownedProductIds = userInventoryRepository.findByUserIdAndActiveTrue(userId).stream()
                    .map(com.seika.marketplace_service.entity.UserInventory::getProductId)
                    .collect(java.util.stream.Collectors.toList());
            return products.stream()
                    .filter(p -> !ownedProductIds.contains(p.getId()))
                    .collect(java.util.stream.Collectors.toList());
        }
        return products;
    }

    public List<Product> getActiveProductsByType(ProductType type) {
        return productRepository.findByActiveTrueAndTypeOrderByCreatedAtDesc(type);
    }

    public Optional<Product> getActiveProductById(String id) {
        return productRepository.findByIdAndActiveTrue(id);
    }
}
