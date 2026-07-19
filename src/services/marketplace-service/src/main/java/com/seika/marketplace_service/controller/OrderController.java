package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.statistics.RevenuePointResponse;
import com.seika.marketplace_service.dto.statistics.StudentPurchaseResponse;
import com.seika.marketplace_service.dto.statistics.TopProductResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
    public ResponseEntity<OrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest request,
                                                     HttpServletRequest httpRequest) {
        List<OrderItem> items = request.getItems().stream()
            .map(itemReq -> OrderItem.builder()
                .productId(itemReq.getProductId())
                .quantity(itemReq.getQuantity())
                .build())
            .toList();

        String buyerId = resolveUserId(httpRequest);
        Order order = orderService.createOrder(buyerId, items);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(order));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<OrderResponse> getOrder(@PathVariable String orderId,
                                                  HttpServletRequest request) {
        Order order = orderService.getOrderForUser(resolveUserId(request), orderId);
        return ResponseEntity.ok(toResponse(order));
    }

    // -------------------------------------------------------------------------
    // Seller statistics endpoints (always derive sellerId from JWT to prevent
    // a teacher from peeking at another teacher's revenue).
    // -------------------------------------------------------------------------

    @GetMapping("/seller/me/revenue")
    public ResponseEntity<List<RevenuePointResponse>> getMyRevenue(
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        String sellerId = resolveUserId(request);
        log.info("Fetching {} revenue series for seller {}", period, sellerId);
        return ResponseEntity.ok(orderService.getRevenueBySeller(sellerId, period));
    }

    @GetMapping("/seller/me/top-products")
    public ResponseEntity<List<TopProductResponse>> getMyTopProducts(
            @RequestParam(required = false) String productType,
            @RequestParam(defaultValue = "10") int limit,
            HttpServletRequest request) {
        String sellerId = resolveUserId(request);
        log.info("Fetching top {} products for seller {} (type={})", limit, sellerId, productType);
        return ResponseEntity.ok(orderService.getTopProductsBySeller(sellerId, productType, limit));
    }

    @GetMapping("/seller/me/students")
    public ResponseEntity<List<StudentPurchaseResponse>> getMyStudents(
            @RequestParam(defaultValue = "100") int limit,
            HttpServletRequest request) {
        String sellerId = resolveUserId(request);
        log.info("Fetching student purchases for seller {} (limit {})", sellerId, limit);
        return ResponseEntity.ok(orderService.getStudentsBySeller(sellerId, limit));
    }

    private static OrderResponse toResponse(Order order) {
        return OrderResponse.builder()
            .id(order.getId())
            .userId(order.getUserId())
            .status(order.getStatus().toString())
            .totalAmount(order.getTotalAmount())
            .createdAt(order.getCreatedAt())
            .updatedAt(order.getUpdatedAt())
            .build();
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
