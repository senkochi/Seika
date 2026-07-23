package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.ProductResponse;
import com.seika.marketplace_service.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@RestController
@RequestMapping("/api/marketplace/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getProducts(
            HttpServletRequest request,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null) {
            userId = request.getHeader("X-Auth-User-Id"); // Fallback
        }

        List<ProductResponse> products = productService.getActiveProducts(userId);
        
        int start = Math.min(page * size, products.size());
        int end = Math.min((page + 1) * size, products.size());
        List<ProductResponse> pageContent = products.subList(start, end);
        
        Page<ProductResponse> result = new PageImpl<>(
                pageContent, 
                PageRequest.of(page, size), 
                products.size()
        );
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ProductResponse> getProduct(@PathVariable String productId) {
        return ResponseEntity.ok(productService.getActiveProductById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found or unavailable: " + productId)));
    }

    @GetMapping("/my-products")
    public ResponseEntity<List<ProductResponse>> getMyProducts(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null) {
            userId = request.getHeader("X-Auth-User-Id"); // Fallback
        }
        return ResponseEntity.ok(productService.getMyProducts(userId));
    }

    @PostMapping("/{productId}/archive")
    public ResponseEntity<ProductResponse> archive(@PathVariable String productId, HttpServletRequest request) {
        return ResponseEntity.ok(productService.archive(resolveUserId(request), productId));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<Void> hardDelete(@PathVariable String productId, HttpServletRequest request) {
        productService.hardDelete(resolveUserId(request), productId);
        return ResponseEntity.noContent().build();
    }

    private String resolveUserId(HttpServletRequest request) {
        String userId = request.getHeader("X-User-Id");
        if (userId == null) {
            userId = request.getHeader("X-Auth-User-Id");
        }
        return userId;
    }
}
