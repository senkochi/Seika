package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.entity.Product;
import com.seika.marketplace_service.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<List<Product>> getProducts(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null) {
            userId = request.getHeader("X-Auth-User-Id"); // Fallback
        }

        return ResponseEntity.ok(productService.getActiveProducts(userId));
    }

    @GetMapping("/my-products")
    public ResponseEntity<List<Product>> getMyProducts(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null) {
            userId = request.getHeader("X-Auth-User-Id"); // Fallback
        }
        return ResponseEntity.ok(productService.getMyProducts(userId));
    }
}
