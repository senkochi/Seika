package com.seika.marketplace_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {
    private final ProductRepository productRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final MarketplaceEscrowSafetyService escrowSafetyService;

    public List<Product> getActiveProducts(String userId) {
        List<Product> products = productRepository.findByActiveTrueAndStatusOrderByCreatedAtDesc(ProductStatus.PUBLISHED);
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
        return productRepository.findByActiveTrueAndStatusAndTypeOrderByCreatedAtDesc(ProductStatus.PUBLISHED, type);
    }

    public Optional<Product> getActiveProductById(String id) {
        return productRepository.findByIdAndActiveTrueAndStatus(id, ProductStatus.PUBLISHED);
    }

    public List<Product> getMyProducts(String sellerUserId) {
        if (sellerUserId == null || sellerUserId.isBlank()) {
            return List.of();
        }
        return productRepository.findBySellerUserIdOrderByCreatedAtDesc(sellerUserId);
    }

    @Transactional
    public Product archive(String sellerUserId, String productId) {
        Product product = mustOwnProduct(sellerUserId, productId);
        product.setStatus(ProductStatus.HIDDEN);
        product.setActive(false);
        return productRepository.save(product);
    }

    @Transactional
    public void hardDelete(String sellerUserId, String productId) {
        Product product = mustOwnProduct(sellerUserId, productId);
        escrowSafetyService.assertHardDeleteAllowed(productId);
        productRepository.delete(product);
    }

    private Product mustOwnProduct(String sellerUserId, String productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product không tồn tại: " + productId));
        if (sellerUserId == null || !sellerUserId.equals(product.getSellerUserId())) {
            throw new IllegalArgumentException("Bạn không có quyền thao tác sản phẩm này.");
        }
        return product;
    }
}
