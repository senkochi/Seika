package com.seika.marketplace_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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
}
