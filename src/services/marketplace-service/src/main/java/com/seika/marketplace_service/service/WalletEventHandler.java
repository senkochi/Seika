package com.seika.marketplace_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

import com.seika.marketplace_service.entity.InboxEvent;
import com.seika.marketplace_service.entity.Order;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.entity.UserInventory;
import com.seika.marketplace_service.enums.InboxStatus;
import com.seika.marketplace_service.enums.EscrowState;
import com.seika.marketplace_service.enums.OrderStatus;
import com.seika.marketplace_service.event.WalletDebitEvent;
import com.seika.marketplace_service.event.WalletEscrowResultEvent;
import com.seika.marketplace_service.repository.InboxEventRepository;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OrderRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class WalletEventHandler {
    private static final String EVENT_SUCCEEDED = "wallet.debit.succeeded";
    private static final String EVENT_FAILED = "wallet.debit.failed";
    private static final int ERROR_LIMIT = 2000;

    private final InboxEventRepository inboxEventRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final ContentPurchasedEventPublisher contentPurchasedEventPublisher;
    private final EscrowService escrowService;

    @Transactional
    public void handleWalletDebitEvent(WalletDebitEvent event, String rawPayload) {
        // Validation: xử lý idempotency dựa trên eventId
        if (event == null || event.getEventId() == null || event.getEventId().isBlank()) {
            log.warn("Skipped wallet.debit event because eventId is empty.");
            return;
        }

        // Validation: fetch existing inbox event từ database bằng messageId (eventId) để kiểm tra xem đã xử lý event này chưa
        Optional<InboxEvent> existingInbox = inboxEventRepository.findByMessageId(event.getEventId());
        if (existingInbox.isPresent() && existingInbox.get().getStatus() == InboxStatus.PROCESSED) {
            log.info("Skipped wallet.debit event because it was already processed. eventId={}", event.getEventId());
            return;
        }

        // Validation: Nếu chưa có inbox event nào hoặc event trước đó bị failed, tạo mới hoặc cập nhật lại inbox event với status RECEIVED
        InboxEvent inbox = existingInbox.orElseGet(() -> InboxEvent.builder()
            .messageId(event.getEventId())
            .eventType(event.getEventType())
            .aggregateId(event.getOrderId())
            .payload(rawPayload)
            .status(InboxStatus.RECEIVED)
            .retryCount(0)
            .build());

        // Lưu inbox event vào database nếu chưa tồn tại, hoặc cập nhật lại status nếu đã tồn tại nhưng bị failed
        if (existingInbox.isEmpty()) {
            inboxEventRepository.save(inbox);
        } else if (inbox.getStatus() == InboxStatus.FAILED) {
            inbox.setStatus(InboxStatus.RECEIVED);
        }

        try {
            // Xử lý event bằng hàm processWalletDebitEvent, nếu có lỗi sẽ bị catch và cập nhật lại inbox event với status FAILED
            processWalletDebitEvent(event);
            inbox.setStatus(InboxStatus.PROCESSED);
            inbox.setProcessedAt(Instant.now());
            inbox.setLastError(null);
            inboxEventRepository.save(inbox);
        } catch (Exception exception) {
            inbox.setStatus(InboxStatus.FAILED);
            inbox.setProcessedAt(Instant.now());
            inbox.setRetryCount(inbox.getRetryCount() + 1);
            inbox.setLastError(truncateError(exception.getMessage()));
            inboxEventRepository.save(inbox);
            throw exception;
        }
    }

    @Transactional
    public void handleWalletEscrowResult(WalletEscrowResultEvent event, String rawPayload) {
        validateEscrowResult(event);
        String messageId = escrowResultMessageId(event);
        Optional<InboxEvent> existingInbox = inboxEventRepository.findByMessageId(messageId);
        if (existingInbox.isPresent() && existingInbox.get().getStatus() == InboxStatus.PROCESSED) {
            log.info("Skipped duplicate escrow result. eventType={}, idempotencyKey={}",
                    event.getEventType(), event.getIdempotencyKey());
            return;
        }

        InboxEvent inbox = existingInbox.orElseGet(() -> InboxEvent.builder()
                .messageId(messageId)
                .eventType(event.getEventType())
                .aggregateId(event.getEscrowId())
                .payload(rawPayload)
                .status(InboxStatus.RECEIVED)
                .retryCount(0)
                .build());
        inbox.setStatus(InboxStatus.RECEIVED);
        inboxEventRepository.save(inbox);

        try {
            escrowService.handleWalletEscrowResult(event);
            inbox.setStatus(InboxStatus.PROCESSED);
            inbox.setProcessedAt(Instant.now());
            inbox.setLastError(null);
            inboxEventRepository.save(inbox);
        } catch (Exception exception) {
            inbox.setStatus(InboxStatus.FAILED);
            inbox.setProcessedAt(Instant.now());
            inbox.setRetryCount(inbox.getRetryCount() + 1);
            inbox.setLastError(truncateError(exception.getMessage()));
            inboxEventRepository.save(inbox);
            throw exception;
        }
    }

    private void validateEscrowResult(WalletEscrowResultEvent event) {
        if (event == null || event.getEventType() == null || event.getEventType().isBlank()) {
            throw new IllegalArgumentException("wallet escrow eventType is required");
        }
        if (event.getIdempotencyKey() == null || event.getIdempotencyKey().isBlank()) {
            throw new IllegalArgumentException("wallet escrow idempotencyKey is required");
        }
        if (event.getEscrowId() == null || event.getEscrowId().isBlank()) {
            throw new IllegalArgumentException("wallet escrow escrowId is required");
        }
    }

    private String escrowResultMessageId(WalletEscrowResultEvent event) {
        String businessKey = event.getEventType() + "|" + event.getIdempotencyKey();
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256").digest(businessKey.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    private void processWalletDebitEvent(WalletDebitEvent event) {
        // Validation: xử lý trường hợp orderId hoặc eventType bị thiếu hoặc không hợp lệ
        if (event.getOrderId() == null || event.getOrderId().isBlank()) {
            throw new IllegalArgumentException("orderId is required");
        }

        // Validation: xử lý trường hợp eventType không phải là wallet.debit.succeeded hoặc wallet.debit.failed
        if (event.getEventType() == null || event.getEventType().isBlank()) {
            throw new IllegalArgumentException("eventType is required");
        }

        // Validation: Fetch order từ database dựa trên orderId trong event, nếu không tìm thấy thì throw exception
        Order order = orderRepository.findById(event.getOrderId())
            .orElseThrow(() -> new IllegalStateException("Order not found: " + event.getOrderId()));

        boolean success = EVENT_SUCCEEDED.equals(event.getEventType());
        boolean failed = EVENT_FAILED.equals(event.getEventType());
        if (!success && !failed) {
            throw new IllegalArgumentException("Unsupported eventType: " + event.getEventType());
        }

        if (success) {
            order.setStatus(OrderStatus.PAID);
            orderRepository.save(order);
            markOrderItemsHeld(order.getId());
            createInventory(order.getUserId(), order.getId());
            escrowService.createEscrowsForPaidOrder(order.getUserId(), order.getId(), event.getSourceBreakdown());
        } else {
            if (order.getStatus() != OrderStatus.PAID) {
                order.setStatus(OrderStatus.FAILED);
                orderRepository.save(order);
            }
        }
    }

    private void markOrderItemsHeld(String orderId) {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        for (OrderItem item : items) {
            if (item.getEscrowState() == EscrowState.NONE) {
                item.setEscrowState(EscrowState.HELD);
            }
        }
        orderItemRepository.saveAll(items);
    }

    private void createInventory(String userId, String orderId) {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        if (items.isEmpty()) {
            log.warn("No order items found for orderId={}", orderId);
            return;
        }

        for (OrderItem item : items) {
            if (userInventoryRepository.existsByUserIdAndProductId(userId, item.getProductId())) {
                continue;
            }

            UserInventory inventory = UserInventory.builder()
                .userId(userId)
                .productId(item.getProductId())
                .productType(item.getProductType())
                .referenceId(item.getReferenceId())
                .orderId(orderId)
                .sourceOrderId(orderId)
                .active(true)
                .build();

            userInventoryRepository.save(inventory);

            // Publish content.purchased so profile-service can increment teacher's totalStudentsReached
            if (item.getSellerUserId() != null && !item.getSellerUserId().isBlank()) {
                contentPurchasedEventPublisher.publishContentPurchased(
                        orderId,
                        userId,
                        item.getSellerUserId(),
                        item.getProductId(),
                        item.getProductType() != null ? item.getProductType().name() : "UNKNOWN",
                        item.getProductName(),
                        item.getTotalPrice()
                );
            }
        }
    }

    private String truncateError(String message) {
        if (message == null) {
            return null;
        }
        return message.length() <= ERROR_LIMIT ? message : message.substring(0, ERROR_LIMIT);
    }
}

