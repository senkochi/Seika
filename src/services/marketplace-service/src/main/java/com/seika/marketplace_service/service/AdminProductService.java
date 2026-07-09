package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminProductService {

    private final ProductRepository productRepository;
    private final MarketplaceNotificationPublisher notificationPublisher;
    private final MarketplaceEscrowSafetyService escrowSafetyService;

    @Transactional(readOnly = true)
    public Page<Product> listByStatus(ProductStatus status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return productRepository.findByStatus(status, pageable);
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return productRepository.countByStatus(ProductStatus.PENDING_REVIEW);
    }

    @Transactional
    public Product approve(String productId) {
        Product product = mustFind(productId);
        product.setStatus(ProductStatus.PUBLISHED);
        product.setActive(true);
        product.setRejectionReason(null);
        Product saved = productRepository.save(product);
        log.info("Admin approved product {} ({})", productId, product.getName());
        notificationPublisher.publishContentReviewed(
                saved.getId(), saved.getName(), saved.getType().name(), saved.getSellerUserId(), "PUBLISHED", null);
        return saved;
    }

    @Transactional
    public Product reject(String productId, String reason) {
        Product product = mustFind(productId);
        product.setStatus(ProductStatus.REJECTED);
        product.setActive(false);
        product.setRejectionReason(reason);
        Product saved = productRepository.save(product);
        escrowSafetyService.cancelHeldItemsByAdmin(productId, "admin_reject_or_hide", "admin");
        log.info("Admin rejected product {} ({}) — reason: {}", productId, product.getName(), reason);
        notificationPublisher.publishContentReviewed(
                saved.getId(), saved.getName(), saved.getType().name(), saved.getSellerUserId(), "REJECTED", reason);
        return saved;
    }

    @Transactional
    public Product hide(String productId) {
        Product product = mustFind(productId);
        product.setStatus(ProductStatus.HIDDEN);
        product.setActive(false);
        Product saved = productRepository.save(product);
        escrowSafetyService.cancelHeldItemsByAdmin(productId, "admin_reject_or_hide", "admin");
        log.info("Admin hid product {} ({})", productId, product.getName());
        return saved;
    }

    private Product mustFind(String productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product không tồn tại: " + productId));
    }
}
