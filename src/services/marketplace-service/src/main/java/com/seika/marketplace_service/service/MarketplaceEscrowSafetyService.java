package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.EscrowState;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MarketplaceEscrowSafetyService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public void markHeldItemsPendingDecision(String productId, String reason) {
        List<OrderItem> items = orderItemRepository.findByProductIdAndEscrowStateIn(productId, List.of(EscrowState.HELD));
        for (OrderItem item : items) {
            EscrowSafetyRules.markPendingDecision(item, reason);
            markOrderNeedsDecision(item.getOrderId());
        }
        orderItemRepository.saveAll(items);
    }

    @Transactional
    public void cancelHeldItemsByAdmin(String productId, String reason, String adminUserId) {
        List<OrderItem> items = orderItemRepository.findByProductIdAndEscrowStateIn(productId, List.of(EscrowState.HELD));
        Instant now = Instant.now();
        for (OrderItem item : items) {
            EscrowSafetyRules.cancelByAdmin(item, reason, adminUserId, now);
            markOrderNeedsDecision(item.getOrderId());
        }
        orderItemRepository.saveAll(items);
    }

    @Transactional(readOnly = true)
    public void assertHardDeleteAllowed(String productId) {
        boolean blocked = orderItemRepository.existsByProductIdAndEscrowStateInAndEscrowFullyRefundedFalse(
                productId,
                EscrowSafetyRules.UNRESOLVED_ESCROW_STATES
        );
        if (blocked) {
            throw new IllegalStateException("Không thể xóa cứng sản phẩm khi escrow/order item còn cần xử lý. Hãy archive sản phẩm.");
        }
    }

    private void markOrderNeedsDecision(String orderId) {
        orderRepository.findById(orderId).ifPresent(order -> {
            order.setNeedsAdminDecision(true);
            orderRepository.save(order);
        });
    }
}
