package com.seika.marketplace_service.controller;

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
import java.util.stream.Collectors;

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
