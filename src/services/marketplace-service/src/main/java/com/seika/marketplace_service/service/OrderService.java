package com.seika.marketplace_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

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

        // Tạo wallet.debit.requested event và lưu vào outbox table để chờ được publish ra message broker
        WalletDebitRequestedEvent event = WalletDebitRequestedEvent.builder()
            .eventId(UUID.randomUUID().toString())
            .eventType(EVENT_TYPE)
            .orderId(order.getId())
            .userId(order.getUserId())
            .amount(order.getTotalAmount())
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
}
