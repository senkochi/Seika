package com.seika.marketplace_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import com.seika.marketplace_service.dto.statistics.RevenuePointResponse;
import com.seika.marketplace_service.dto.statistics.StudentPurchaseResponse;
import com.seika.marketplace_service.dto.statistics.TopProductResponse;
import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.enums.OrderStatus;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.event.WalletDebitRequestedEvent;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OrderRepository;
import com.seika.marketplace_service.repository.OutboxEventRepository;

@Service
@RequiredArgsConstructor
public class OrderService {
    private static final String EVENT_TYPE = "wallet.debit.requested";

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Order createOrder(String userId, List<OrderItem> items) {

        // Validation: xử lý trường hợp userId và danh sách OrderItem bị thiếu hoặc không hợp lệ
        if (userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("userId is required");
        }
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("items is required");
        }

        // Check if buying own item
        for (OrderItem item : items) {
            if (userId.equals(item.getSellerUserId())) {
                throw new IllegalArgumentException("Bạn không thể tự mua sản phẩm của chính mình.");
            }
        }

        // Check if already purchased
        List<String> productIds = items.stream().map(OrderItem::getProductId).toList();
        boolean alreadyPurchased = orderRepository.existsByUserIdAndProductIdsAndStatuses(
            userId,
            productIds,
            Arrays.asList(OrderStatus.PENDING_PAYMENT, OrderStatus.PAID)
        );

        if (alreadyPurchased) {
            throw new IllegalArgumentException("Bạn đã sở hữu hoặc đang có giao dịch mua sản phẩm này rồi.");
        }

        // Tính toán tổng amount của order dựa trên unitPrice và quantity của từng OrderItem
        BigDecimal totalAmount = calculateTotal(items);

        // Tạo order mới với status PENDING_PAYMENT và lưu vào database
        Order order = Order.builder()
            .userId(userId)
            .status(OrderStatus.PENDING_PAYMENT)
            .totalAmount(totalAmount)
            .build();
        orderRepository.save(order);

        // Cập nhật orderId cho từng OrderItem và lưu vào database
        for (OrderItem item : items) {
            item.setOrderId(order.getId());
        }
        orderItemRepository.saveAll(items);

        String description = items.stream()
            .map(item -> {
                String typeStr = item.getProductType() != null ? 
                    (item.getProductType().name().equalsIgnoreCase("FLASHCARD") ? "Flashcard" : 
                    item.getProductType().name().equalsIgnoreCase("QUIZ") ? "Quiz" : item.getProductType().name()) : "Sản phẩm";
                return typeStr + ": " + item.getProductName();
            })
            .collect(java.util.stream.Collectors.joining(", "));
        if (description.length() > 255) {
            description = description.substring(0, 252) + "...";
        }

        // Tạo wallet.debit.requested event và lưu vào outbox table để chờ được publish ra message broker
        WalletDebitRequestedEvent event = WalletDebitRequestedEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType(EVENT_TYPE)
            .idempotencyKey("order:" + order.getId() + ":debit")
            .orderId(order.getId())
            .userId(order.getUserId())
            .amount(order.getTotalAmount())
            .description(description)
            .build();
        OutboxEvent outboxEvent = OutboxEvent.builder()
            .aggregateType("Order")
            .aggregateId(order.getId())
            .eventType(event.getEventType())
            .payload(toJson(event))
            .status(OutboxStatus.PENDING)
            .retryCount(0)
            .build();
        outboxEventRepository.save(outboxEvent);
        return order;
    }


    @Transactional(readOnly = true)
    public Order getOrderForUser(String userId, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));
        if (userId == null || !userId.equals(order.getUserId())) {
            throw new IllegalArgumentException("Bạn không có quyền xem đơn hàng này.");
        }
        return order;
    }
    private BigDecimal calculateTotal(List<OrderItem> items) {
        BigDecimal total = BigDecimal.ZERO;
        for (OrderItem item : items) {
            if (item.getUnitPrice() == null) {
                throw new IllegalArgumentException("unitPrice is required");
            }
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("quantity must be positive");
            }
            BigDecimal lineTotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));
            item.setTotalPrice(lineTotal);
            total = total.add(lineTotal);
        }
        return total;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize outbox payload", exception);
        }
    }

    // -------------------------------------------------------------------------
    // Teacher statistics
    // -------------------------------------------------------------------------

    /**
     * Aggregated revenue for a seller grouped by period. The {@code period}
     * argument accepts {@code "day"} (last 30 days) or {@code "month"} (last
     * 12 months — capped by the JPQL query's groupby year-month).
     */
    @Transactional(readOnly = true)
    public List<RevenuePointResponse> getRevenueBySeller(String sellerUserId, String period) {
        List<OrderItemRepository.RevenuePointProjection> rows = "day".equalsIgnoreCase(period)
                ? orderItemRepository.findDailyRevenueBySeller(sellerUserId, 30)
                : orderItemRepository.findMonthlyRevenueBySeller(sellerUserId);

        return rows.stream()
                .map(r -> RevenuePointResponse.builder()
                        .period(r.getPeriod())
                        .totalRevenue(r.getTotalRevenue() == null ? BigDecimal.ZERO : r.getTotalRevenue())
                        .orderCount(r.getOrderCount() == null ? 0L : r.getOrderCount())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TopProductResponse> getTopProductsBySeller(String sellerUserId, String productType, int limit) {
        return orderItemRepository
                .findTopProductsBySeller(sellerUserId, productType, PageRequest.of(0, limit))
                .stream()
                .map(p -> TopProductResponse.builder()
                        .productId(p.getProductId())
                        .productType(p.getProductType())
                        .productName(p.getProductName())
                        .unitPrice(p.getUnitPrice())
                        .totalSold(p.getTotalSold() == null ? 0L : p.getTotalSold())
                        .totalRevenue(p.getTotalRevenue() == null ? BigDecimal.ZERO : p.getTotalRevenue())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentPurchaseResponse> getStudentsBySeller(String sellerUserId, int limit) {
        return orderItemRepository
                .findStudentsBySeller(sellerUserId, PageRequest.of(0, limit))
                .stream()
                .map(p -> StudentPurchaseResponse.builder()
                        .userId(p.getUserId())
                        .productId(p.getProductId())
                        .productType(p.getProductType())
                        .productName(p.getProductName())
                        .unitPrice(p.getUnitPrice())
                        .purchasedAt(p.getPurchasedAt())
                        .build())
                .toList();
    }
}
