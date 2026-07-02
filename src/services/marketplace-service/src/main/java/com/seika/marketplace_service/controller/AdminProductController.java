package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.admin.RejectProductRequest;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.service.AdminProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/marketplace/admin/products")
@RequiredArgsConstructor
@Slf4j
public class AdminProductController {

    private final AdminProductService adminProductService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Product>> listByStatus(
            @RequestParam(defaultValue = "PENDING_REVIEW") ProductStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Admin list products status={} page={} size={}", status, page, size);
        return ResponseEntity.ok(adminProductService.listByStatus(status, page, size));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<Product>> listPending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(adminProductService.listByStatus(ProductStatus.PENDING_REVIEW, page, size));
    }

    @GetMapping("/count-pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Long> countPending() {
        return ResponseEntity.ok(adminProductService.countPending());
    }

    @PostMapping("/{productId}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> approve(@PathVariable String productId) {
        log.info("Admin approve product {}", productId);
        return ResponseEntity.ok(adminProductService.approve(productId));
    }

    @PostMapping("/{productId}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> reject(
            @PathVariable String productId,
            @Valid @RequestBody RejectProductRequest request) {
        log.info("Admin reject product {} — reason: {}", productId, request.getReason());
        return ResponseEntity.ok(adminProductService.reject(productId, request.getReason()));
    }

    @PostMapping("/{productId}/hide")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Product> hide(@PathVariable String productId) {
        log.info("Admin hide product {}", productId);
        return ResponseEntity.ok(adminProductService.hide(productId));
    }
}