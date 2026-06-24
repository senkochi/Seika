package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.entity.UserInventory;
import com.seika.marketplace_service.repository.ProductRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/marketplace/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final UserInventoryRepository userInventoryRepository;
    private final ProductRepository productRepository;

    @GetMapping("/my-items")
    public ResponseEntity<List<Product>> getMyInventory(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null) {
            userId = request.getHeader("X-Auth-User-Id"); // Fallback
        }
        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<UserInventory> inventories = userInventoryRepository.findByUserIdAndActiveTrue(userId);
        List<String> productIds = inventories.stream()
                .map(UserInventory::getProductId)
                .collect(Collectors.toList());

        List<Product> products = productRepository.findAllById(productIds);
        return ResponseEntity.ok(products);
    }
}
