package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.InventoryItemResponse;
import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.entity.UserInventory;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.RequestParam;
import com.seika.marketplace_service.enums.ProductType;

@RestController
@RequestMapping("/api/marketplace/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final UserInventoryRepository userInventoryRepository;
    private final ProductRepository productRepository;

    @GetMapping("/my-items")
    public ResponseEntity<List<Product>> getMyInventory(HttpServletRequest request) {
        String userId = resolveUserId(request);
        List<UserInventory> inventories = userInventoryRepository.findByUserIdAndActiveTrue(userId);
        List<String> productIds = inventories.stream()
                .map(UserInventory::getProductId)
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/my-items/paginated")
    public ResponseEntity<Page<Product>> getMyInventoryPaginated(
            HttpServletRequest request,
            @RequestParam(required = false) ProductType type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size) {
        String userId = resolveUserId(request);
        List<UserInventory> inventories = userInventoryRepository.findByUserIdAndActiveTrue(userId);
        
        if (type != null) {
            inventories = inventories.stream()
                    .filter(inv -> type.equals(inv.getProductType()))
                    .collect(Collectors.toList());
        }

        List<String> productIds = inventories.stream()
                .map(UserInventory::getProductId)
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        
        int start = Math.min(page * size, products.size());
        int end = Math.min((page + 1) * size, products.size());
        List<Product> pageContent = products.subList(start, end);
        
        return ResponseEntity.ok(new PageImpl<>(pageContent, PageRequest.of(page, size), products.size()));
    }

    @GetMapping("/my-items/detail")
    public ResponseEntity<List<InventoryItemResponse>> getMyInventoryDetails(HttpServletRequest request) {
        String userId = resolveUserId(request);
        List<UserInventory> inventories = userInventoryRepository.findByUserIdAndActiveTrue(userId);
        List<String> productIds = inventories.stream()
                .map(UserInventory::getProductId)
                .toList();
        Map<String, Product> productsById = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        List<InventoryItemResponse> response = inventories.stream()
                .map(inventory -> InventoryItemResponse.builder()
                        .id(inventory.getId())
                        .userId(inventory.getUserId())
                        .productId(inventory.getProductId())
                        .productType(inventory.getProductType().name())
                        .referenceId(inventory.getReferenceId())
                        .orderId(inventory.getOrderId())
                        .active(inventory.isActive())
                        .acquiredAt(inventory.getAcquiredAt())
                        .consumedAt(inventory.getConsumedAt())
                        .revokedAt(inventory.getRevokedAt())
                        .revocationReason(inventory.getRevocationReason())
                        .product(productsById.get(inventory.getProductId()))
                        .build())
                .toList();
        return ResponseEntity.ok(response);
    }

    private static String resolveUserId(HttpServletRequest request) {
        String header = request.getHeader("X-User-Id");
        if (header == null || header.isBlank()) {
            header = request.getHeader("X-Auth-User-Id");
        }
        if (header != null && !header.isBlank()) {
            return header;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || "anonymousUser".equals(auth.getPrincipal().toString())) {
            throw new IllegalStateException("User not authenticated");
        }
        return auth.getPrincipal().toString();
    }
}
