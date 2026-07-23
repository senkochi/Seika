package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.EscrowState;
import com.seika.marketplace_service.enums.EscrowStatus;
import com.seika.marketplace_service.repository.EscrowTransactionRepository;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarketplaceEscrowSafetyService {

    private final OrderItemRepository orderItemRepository;
    private final OrderRepository orderRepository;
    private final EscrowTransactionRepository escrowTransactionRepository;

    @Transactional
    public void markHeldItemsPendingDecision(String productId, String reason) {
        List<OrderItem> items = orderItemRepository.findByProductIdAndEscrowStateIn(productId, List.of(EscrowState.HELD));
        for (OrderItem item : items) {
            EscrowSafetyRules.markPendingDecision(item, reason);
            escrowTransactionRepository.findByOrderItemId(item.getId()).ifPresent(escrow -> {
                escrow.setStatus(EscrowStatus.PENDING_ADMIN_DECISION);
                escrow.setNeedsAdminDecision(true);
                escrow.setReviewReason(reason);
                escrowTransactionRepository.save(escrow);
            });
            markOrderNeedsDecision(item.getOrderId());
        }
        orderItemRepository.saveAll(items);
        log.info("Marked {} held order items pending admin decision for productId={} reason={}", items.size(), productId, reason);
    }

    @Transactional
    public void cancelHeldItemsByAdmin(String productId, String reason, String adminUserId) {
        List<OrderItem> items = orderItemRepository.findByProductIdAndEscrowStateIn(productId, List.of(EscrowState.HELD));
        Instant now = Instant.now();
        for (OrderItem item : items) {
            EscrowSafetyRules.cancelByAdmin(item, reason, adminUserId, now);
            escrowTransactionRepository.findByOrderItemId(item.getId()).ifPresent(escrow -> {
                escrow.setStatus(EscrowStatus.CANCELLED_BY_ADMIN);
                escrow.setNeedsAdminDecision(true);
                escrow.setReviewReason(reason);
                escrowTransactionRepository.save(escrow);
            });
            markOrderNeedsDecision(item.getOrderId());
        }
        orderItemRepository.saveAll(items);
        log.info("Cancelled {} held order items by admin for productId={} reason={}", items.size(), productId, reason);
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

