package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.statistics.RevenuePointResponse;
import com.seika.marketplace_service.dto.statistics.StudentPurchaseResponse;
import com.seika.marketplace_service.dto.statistics.TopProductResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import com.seika.marketplace_service.dto.CreateOrderRequest;
import com.seika.marketplace_service.dto.OrderResponse;
import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.service.OrderService;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {
    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        List<OrderItem> items = request.getItems().stream()
            .map(itemReq -> OrderItem.builder()
                .productId(itemReq.getProductId())
                .productType(ProductType.valueOf(itemReq.getProductType()))
                .referenceId(itemReq.getReferenceId())
                .productName(itemReq.getProductName())
                .sellerUserId(itemReq.getSellerUserId())
                .unitPrice(itemReq.getUnitPrice())
                .quantity(itemReq.getQuantity())
                .build())
            .toList();

        Order order = orderService.createOrder(request.getUserId(), items);

        OrderResponse response = OrderResponse.builder()
            .id(order.getId())
            .userId(order.getUserId())
            .status(order.getStatus().toString())
            .totalAmount(order.getTotalAmount())
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // -------------------------------------------------------------------------
    // Seller statistics endpoints (always derive sellerId from JWT to prevent
    // a teacher from peeking at another teacher's revenue).
    // -------------------------------------------------------------------------

    @GetMapping("/seller/me/revenue")
    public ResponseEntity<List<RevenuePointResponse>> getMyRevenue(
            @RequestParam(defaultValue = "month") String period) {
        String sellerId = resolveUserId();
        log.info("Fetching {} revenue series for seller {}", period, sellerId);
        return ResponseEntity.ok(orderService.getRevenueBySeller(sellerId, period));
    }

    @GetMapping("/seller/me/top-products")
    public ResponseEntity<List<TopProductResponse>> getMyTopProducts(
            @RequestParam(required = false) String productType,
            @RequestParam(defaultValue = "10") int limit) {
        String sellerId = resolveUserId();
        log.info("Fetching top {} products for seller {} (type={})", limit, sellerId, productType);
        return ResponseEntity.ok(orderService.getTopProductsBySeller(sellerId, productType, limit));
    }

    @GetMapping("/seller/me/students")
    public ResponseEntity<List<StudentPurchaseResponse>> getMyStudents(
            @RequestParam(defaultValue = "100") int limit) {
        String sellerId = resolveUserId();
        log.info("Fetching student purchases for seller {} (limit {})", sellerId, limit);
        return ResponseEntity.ok(orderService.getStudentsBySeller(sellerId, limit));
    }

    /**
     * Resolves the authenticated userId from {@link SecurityContextHolder}. The
     * gateway forwards {@code X-User-Id} headers which our JWT filter copies
     * into the authentication principal.
     */
    private static String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null) {
            throw new IllegalStateException("User not authenticated");
        }
        String principal = auth.getPrincipal().toString();
        if (principal.isBlank()) {
            throw new IllegalStateException("Authenticated principal has no userId claim");
        }
        return principal;
    }
}