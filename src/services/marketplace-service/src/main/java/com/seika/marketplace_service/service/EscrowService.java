package com.seika.marketplace_service.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.entity.OutboxEvent;
import com.seika.marketplace_service.entity.TeacherRating;
import com.seika.marketplace_service.entity.UserInventory;
import com.seika.marketplace_service.enums.EscrowState;
import com.seika.marketplace_service.enums.EscrowStatus;
import com.seika.marketplace_service.enums.OutboxStatus;
import com.seika.marketplace_service.event.WalletCreditRequestedEvent;
import com.seika.marketplace_service.event.WalletDebitEvent;
import com.seika.marketplace_service.event.WalletEscrowResultEvent;
import com.seika.marketplace_service.event.WalletRefundRequestedEvent;
import com.seika.marketplace_service.repository.EscrowTransactionRepository;
import com.seika.marketplace_service.repository.OrderItemRepository;
import com.seika.marketplace_service.repository.OutboxEventRepository;
import com.seika.marketplace_service.repository.UserInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscrowService {
    public static final String CREDIT_REQUESTED = "wallet.credit.requested";
    public static final String REFUND_REQUESTED = "wallet.refund.requested";

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

    private final EscrowTransactionRepository escrowRepository;
    private final OrderItemRepository orderItemRepository;
    private final UserInventoryRepository userInventoryRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final MarketplaceConfigService configService;
    private final TeacherRatingService teacherRatingService;
    private final ObjectMapper objectMapper;

    @Transactional
    public void createEscrowsForPaidOrder(String buyerId, String orderId, WalletDebitEvent.SourceBreakdown breakdown) {
        List<OrderItem> items = orderItemRepository.findByOrderId(orderId);
        SourceCursor cursor = new SourceCursor(breakdown);
        int holdDays = configService.getInt(MarketplaceConfigService.KEY_ESCROW_HOLD_DAYS, 7);
        Instant releaseAt = Instant.now().plus(holdDays, ChronoUnit.DAYS);
        for (OrderItem item : items) {
            if (escrowRepository.findByOrderItemId(item.getId()).isPresent()) {
                continue;
            }
            SourceSlice slice = cursor.take(item.getTotalPrice());
            EscrowTransaction escrow = EscrowTransaction.builder()
                    .orderId(orderId)
                    .orderItemId(item.getId())
                    .buyerId(buyerId)
                    .sellerId(item.getSellerUserId())
                    .productId(item.getProductId())
                    .productType(item.getProductType())
                    .grossAmount(item.getTotalPrice())
                    .bonusBackedAmount(slice.bonus())
                    .rewardBackedAmount(slice.reward())
                    .paidBackedAmount(slice.paid())
                    .earnedPromoBackedAmount(slice.earnedPromo())
                    .promoBackedAmount(slice.promoBacked())
                    .status(EscrowStatus.HELD)
                    .releaseAt(releaseAt)
                    .build();
            escrowRepository.save(escrow);
            item.setEscrowState(EscrowState.HELD);
        }
        orderItemRepository.saveAll(items);
    }

    @Scheduled(fixedDelayString = "${escrow.release.delay-ms:60000}")
    @Transactional
    public void releaseDueEscrows() {
        List<EscrowTransaction> due = escrowRepository
                .findByStatusAndNeedsAdminDecisionFalseAndReleaseAtLessThanEqualAndCreditRequestedAtIsNullAndRefundRequestedAtIsNull(
                        EscrowStatus.HELD, Instant.now());
        for (EscrowTransaction escrow : due) {
            requestRelease(escrow);
        }
    }

    @Transactional
    public void requestRelease(EscrowTransaction escrow) {
        if (escrow.getStatus() != EscrowStatus.HELD || escrow.isNeedsAdminDecision()) {
            return;
        }
        computeReleaseAmounts(escrow);
        WalletCreditRequestedEvent event = WalletCreditRequestedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(CREDIT_REQUESTED)
                .idempotencyKey("escrow:" + escrow.getId() + ":release")
                .escrowId(escrow.getId())
                .orderId(escrow.getOrderId())
                .orderItemId(escrow.getOrderItemId())
                .sellerUserId(escrow.getSellerId())
                .buyerUserId(escrow.getBuyerId())
                .teacherWithdrawableAmount(escrow.getTeacherWithdrawableNet())
                .teacherPromoAmount(escrow.getTeacherPromoNet())
                .platformFeeReal(escrow.getPlatformFeeReal())
                .platformFeePromoSink(escrow.getPlatformFeePromoSink())
                .occurredAt(Instant.now())
                .build();
        saveOutbox("EscrowTransaction", escrow.getId(), CREDIT_REQUESTED, event);
        escrow.setCreditRequestedAt(Instant.now());
        escrow.setLastWalletError(null);
        escrowRepository.save(escrow);
    }

    public void computeReleaseAmounts(EscrowTransaction escrow) {
        TeacherRating rating = teacherRatingService.getOrDefault(escrow.getSellerId());
        BigDecimal tierFee = rating.getTierFeePercent() == null ? new BigDecimal("20") : rating.getTierFeePercent();
        BigDecimal escrowFee = configService.getBigDecimal(MarketplaceConfigService.KEY_ESCROW_OPERATION_FEE_PERCENT, BigDecimal.ZERO);
        BigDecimal feePercent = tierFee.add(escrowFee);
        BigDecimal netMultiplier = ONE_HUNDRED.subtract(feePercent).divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP);
        BigDecimal feeMultiplier = feePercent.divide(ONE_HUNDRED, 6, RoundingMode.HALF_UP);

        escrow.setTierAtRelease(rating.getTier());
        escrow.setTierFeePercent(tierFee);
        escrow.setEscrowFeePercent(escrowFee);
        escrow.setTeacherWithdrawableNet(money(escrow.getPaidBackedAmount().multiply(netMultiplier)));
        escrow.setTeacherPromoNet(money(escrow.getPromoBackedAmount().multiply(netMultiplier)));
        escrow.setPlatformFeeReal(money(escrow.getPaidBackedAmount().multiply(feeMultiplier)));
        escrow.setPlatformFeePromoSink(money(escrow.getPromoBackedAmount().multiply(feeMultiplier)));
    }

    @Transactional
    public EscrowTransaction requestSelfServiceRefund(String buyerId, String escrowId) {
        EscrowTransaction escrow = escrowRepository.findById(escrowId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found: " + escrowId));
        if (!buyerId.equals(escrow.getBuyerId())) {
            throw new IllegalArgumentException("You can only refund your own purchase");
        }
        if (escrow.getStatus() != EscrowStatus.HELD || escrow.isNeedsAdminDecision()
                || escrow.getCreditRequestedAt() != null || escrow.getRefundRequestedAt() != null) {
            throw new IllegalStateException("Escrow is not eligible for self-service refund");
        }
        UserInventory inventory = userInventoryRepository.findByOrderIdAndProductIdAndActiveTrue(escrow.getOrderId(), escrow.getProductId())
                .orElseThrow(() -> new IllegalStateException("Inventory not found for escrow"));
        if (inventory.getConsumedAt() != null) {
            throw new IllegalStateException("Consumed content requires admin refund override");
        }
        requestRefund(escrow, "self_service_refund");
        return escrow;
    }

    @Transactional
    public EscrowTransaction adminFullRefund(String orderItemId, String adminId, String reason) {
        EscrowTransaction escrow = escrowRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found for orderItem: " + orderItemId));
        requestRefund(escrow, reason == null ? "admin_full_refund" : reason);
        markAdminDecision(escrow, adminId, reason);
        return escrow;
    }

    @Transactional
    public EscrowTransaction adminForceRelease(String orderItemId, String adminId, String reason) {
        EscrowTransaction escrow = escrowRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found for orderItem: " + orderItemId));
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setNeedsAdminDecision(false);
        escrow.setReviewReason(null);
        escrow.setReleaseAt(Instant.now());
        escrow.setCreditRequestedAt(null);
        escrow.setLastWalletError(null);
        markAdminDecision(escrow, adminId, reason);
        requestRelease(escrow);
        return escrow;
    }

    @Transactional
    public EscrowTransaction adminNoRefund(String orderItemId, String adminId, String reason) {
        EscrowTransaction escrow = escrowRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found for orderItem: " + orderItemId));
        escrow.setNeedsAdminDecision(true);
        escrow.setStatus(EscrowStatus.PENDING_ADMIN_DECISION);
        markAdminDecision(escrow, adminId, reason == null ? "admin_no_refund" : reason);
        return escrowRepository.save(escrow);
    }

    private void requestRefund(EscrowTransaction escrow, String reason) {
        WalletRefundRequestedEvent event = WalletRefundRequestedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(REFUND_REQUESTED)
                .idempotencyKey("escrow:" + escrow.getId() + ":refund")
                .escrowId(escrow.getId())
                .orderId(escrow.getOrderId())
                .orderItemId(escrow.getOrderItemId())
                .buyerUserId(escrow.getBuyerId())
                .bonusAmount(escrow.getBonusBackedAmount())
                .rewardAmount(escrow.getRewardBackedAmount())
                .paidAmount(escrow.getPaidBackedAmount())
                .earnedPromoAmount(escrow.getEarnedPromoBackedAmount())
                .occurredAt(Instant.now())
                .build();
        saveOutbox("EscrowTransaction", escrow.getId(), REFUND_REQUESTED, event);
        escrow.setRefundRequestedAt(Instant.now());
        escrow.setNeedsAdminDecision(false);
        escrow.setReviewReason(reason);
        escrow.setLastWalletError(null);
        escrowRepository.save(escrow);
    }

    @Transactional
    public void handleWalletEscrowResult(WalletEscrowResultEvent event) {
        EscrowTransaction escrow = escrowRepository.findById(event.getEscrowId())
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found: " + event.getEscrowId()));
        if ("wallet.credit.succeeded".equals(event.getEventType())) {
            escrow.setStatus(EscrowStatus.RELEASED);
            escrow.setReleasedAt(event.getOccurredAt() == null ? Instant.now() : event.getOccurredAt());
            escrow.setNeedsAdminDecision(false);
            escrow.setLastWalletError(null);
            updateOrderItemState(escrow, EscrowState.RELEASED, false, null);
        } else if ("wallet.refund.succeeded".equals(event.getEventType())) {
            escrow.setStatus(EscrowStatus.REFUNDED);
            escrow.setRefundedAt(event.getOccurredAt() == null ? Instant.now() : event.getOccurredAt());
            escrow.setNeedsAdminDecision(false);
            escrow.setLastWalletError(null);
            revokeInventory(escrow);
            updateOrderItemState(escrow, EscrowState.REFUNDED, true, null);
        } else if ("wallet.credit.failed".equals(event.getEventType())) {
            escrow.setCreditRequestedAt(null);
            escrow.setNeedsAdminDecision(true);
            escrow.setReviewReason("wallet_credit_failed");
            escrow.setLastWalletError(event.getReason());
            updateOrderItemState(escrow, EscrowState.PENDING_ADMIN_DECISION, false, "wallet_credit_failed");
        } else if ("wallet.refund.failed".equals(event.getEventType())) {
            escrow.setRefundRequestedAt(null);
            escrow.setNeedsAdminDecision(true);
            escrow.setReviewReason("wallet_refund_failed");
            escrow.setLastWalletError(event.getReason());
            updateOrderItemState(escrow, EscrowState.PENDING_ADMIN_DECISION, false, "wallet_refund_failed");
        }
        escrowRepository.save(escrow);
    }

    @Transactional(readOnly = true)
    public List<EscrowTransaction> getMyEscrows(String userId) {
        return escrowRepository.findByBuyerIdAndStatusInOrderByCreatedAtDesc(userId,
                List.of(EscrowStatus.HELD, EscrowStatus.PENDING_ADMIN_DECISION, EscrowStatus.RELEASED, EscrowStatus.REFUNDED));
    }

    @Transactional(readOnly = true)
    public List<EscrowTransaction> getSellerPendingEscrows(String sellerId) {
        return escrowRepository.findBySellerIdAndStatusInOrderByCreatedAtDesc(sellerId,
                List.of(EscrowStatus.HELD, EscrowStatus.PENDING_ADMIN_DECISION));
    }

    @Transactional(readOnly = true)
    public List<EscrowTransaction> getPendingDecisionEscrows() {
        return escrowRepository.findByNeedsAdminDecisionTrueOrderByUpdatedAtAsc();
    }

    private void revokeInventory(EscrowTransaction escrow) {
        userInventoryRepository.findByOrderIdAndProductIdAndActiveTrue(escrow.getOrderId(), escrow.getProductId())
                .ifPresent(inventory -> {
                    inventory.setActive(false);
                    inventory.setRevokedAt(Instant.now());
                    inventory.setRevocationReason("escrow_refund");
                    userInventoryRepository.save(inventory);
                });
    }

    private void updateOrderItemState(EscrowTransaction escrow, EscrowState state, boolean fullyRefunded, String reason) {
        orderItemRepository.findById(escrow.getOrderItemId()).ifPresent(item -> {
            item.setEscrowState(state);
            item.setEscrowFullyRefunded(fullyRefunded);
            item.setEscrowNeedsReview(reason != null);
            item.setEscrowReviewReason(reason);
            orderItemRepository.save(item);
        });
    }

    private void markAdminDecision(EscrowTransaction escrow, String adminId, String reason) {
        orderItemRepository.findById(escrow.getOrderItemId()).ifPresent(item -> {
            item.setAdminDecisionAt(Instant.now());
            item.setAdminDecisionBy(adminId);
            item.setAdminDecisionReason(reason);
            orderItemRepository.save(item);
        });
    }

    private void saveOutbox(String aggregateType, String aggregateId, String eventType, Object event) {
        try {
            outboxEventRepository.save(OutboxEvent.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .payload(objectMapper.writeValueAsString(event))
                    .status(OutboxStatus.PENDING)
                    .retryCount(0)
                    .build());
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Failed to serialize escrow wallet command", exception);
        }
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }

    private record SourceSlice(BigDecimal bonus, BigDecimal reward, BigDecimal paid, BigDecimal earnedPromo) {
        BigDecimal promoBacked() {
            return bonus.add(reward).add(earnedPromo);
        }
    }

    private static final class SourceCursor {
        private BigDecimal bonus;
        private BigDecimal reward;
        private BigDecimal paid;
        private BigDecimal earnedPromo;

        SourceCursor(WalletDebitEvent.SourceBreakdown breakdown) {
            WalletDebitEvent.SourceBreakdown source = breakdown == null ? new WalletDebitEvent.SourceBreakdown() : breakdown;
            this.bonus = zero(source.getBonusAmount());
            this.reward = zero(source.getRewardAmount());
            this.paid = zero(source.getPaidAmount());
            this.earnedPromo = zero(source.getEarnedPromoAmount());
        }

        SourceSlice take(BigDecimal amount) {
            BigDecimal remaining = zero(amount);
            BigDecimal fromBonus = takeFromBonus(remaining);
            remaining = remaining.subtract(fromBonus);
            BigDecimal fromReward = takeFromReward(remaining);
            remaining = remaining.subtract(fromReward);
            BigDecimal fromPaid = takeFromPaid(remaining);
            remaining = remaining.subtract(fromPaid);
            BigDecimal fromEarnedPromo = takeFromEarnedPromo(remaining);
            remaining = remaining.subtract(fromEarnedPromo);
            if (remaining.compareTo(BigDecimal.ZERO) > 0) {
                fromPaid = fromPaid.add(remaining);
            }
            return new SourceSlice(fromBonus, fromReward, fromPaid, fromEarnedPromo);
        }

        private BigDecimal takeFromBonus(BigDecimal requested) {
            BigDecimal used = bonus.min(requested);
            bonus = bonus.subtract(used);
            return used;
        }

        private BigDecimal takeFromReward(BigDecimal requested) {
            BigDecimal used = reward.min(requested);
            reward = reward.subtract(used);
            return used;
        }

        private BigDecimal takeFromPaid(BigDecimal requested) {
            BigDecimal used = paid.min(requested);
            paid = paid.subtract(used);
            return used;
        }

        private BigDecimal takeFromEarnedPromo(BigDecimal requested) {
            BigDecimal used = earnedPromo.min(requested);
            earnedPromo = earnedPromo.subtract(used);
            return used;
        }

        private static BigDecimal zero(BigDecimal value) {
            return value == null ? BigDecimal.ZERO : value;
        }
    }
}


