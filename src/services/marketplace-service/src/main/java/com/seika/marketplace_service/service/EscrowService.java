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

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private AdminActionLogService adminActionLogService;

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
        ensureWalletActionAllowed(escrow, "refund");
        requestRefund(escrow, reason == null ? "admin_full_refund" : reason);
        markAdminDecision(escrow, adminId, reason);
        return escrow;
    }

    @Transactional
    public EscrowTransaction adminPartialRefund(String orderItemId, BigDecimal amount, String adminId, String reason) {
        EscrowTransaction escrow = escrowRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found for orderItem: " + orderItemId));
        ensureWalletActionAllowed(escrow, "refund");
        BigDecimal refundAmount = money(amount);
        requestPartialRefund(escrow, refundAmount, reason == null ? "admin_partial_refund" : reason);
        markAdminDecision(escrow, adminId, reason);
        logAdminAction(adminId, "PARTIAL_REFUND_ESCROW", "ORDER_ITEM", orderItemId, reason,
                "{\"escrowId\":\"" + escrow.getId() + "\",\"amount\":\"" + refundAmount.toPlainString() + "\"}");
        return escrow;
    }

    @Transactional
    public EscrowTransaction adminForceRelease(String orderItemId, String adminId, String reason) {
        EscrowTransaction escrow = escrowRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found for orderItem: " + orderItemId));
        ensureWalletActionAllowed(escrow, "release");
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setNeedsAdminDecision(false);
        escrow.setReviewReason(null);
        escrow.setReleaseAt(Instant.now());
        escrow.setLastWalletError(null);
        markAdminDecision(escrow, adminId, reason);
        requestRelease(escrow);
        return escrow;
    }

    @Transactional
    public EscrowTransaction adminNoRefund(String orderItemId, String adminId, String reason) {
        EscrowTransaction escrow = escrowRepository.findByOrderItemId(orderItemId)
                .orElseThrow(() -> new IllegalArgumentException("Escrow not found for orderItem: " + orderItemId));
        ensureWalletActionAllowed(escrow, "no-refund");
        escrow.setStatus(EscrowStatus.HELD);
        escrow.setNeedsAdminDecision(false);
        escrow.setReviewReason(null);
        escrow.setLastWalletError(null);
        markAdminDecision(escrow, adminId, reason == null ? "admin_no_refund" : reason);
        logAdminAction(adminId, "NO_REFUND_ESCROW", "ORDER_ITEM", orderItemId, reason,
                "{\"escrowId\":\"" + escrow.getId() + "\"}");
        if (escrow.getReleaseAt() == null || !escrow.getReleaseAt().isAfter(Instant.now())) {
            requestRelease(escrow);
        } else {
            updateOrderItemState(escrow, EscrowState.HELD, false, null);
            escrowRepository.save(escrow);
        }
        return escrow;
    }

    private void requestPartialRefund(EscrowTransaction escrow, BigDecimal amount, String reason) {
        BigDecimal gross = money(escrow.getGrossAmount());
        BigDecimal refundAmount = money(amount);
        if (refundAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Partial refund amount must be positive");
        }
        if (gross.compareTo(BigDecimal.ZERO) <= 0 || refundAmount.compareTo(gross) >= 0) {
            throw new IllegalArgumentException("Partial refund amount must be lower than gross escrow amount");
        }

        BigDecimal ratio = refundAmount.divide(gross, 8, RoundingMode.HALF_UP);
        BigDecimal bonus = money(zero(escrow.getBonusBackedAmount()).multiply(ratio));
        BigDecimal reward = money(zero(escrow.getRewardBackedAmount()).multiply(ratio));
        BigDecimal earnedPromo = money(zero(escrow.getEarnedPromoBackedAmount()).multiply(ratio));
        BigDecimal paid = money(refundAmount.subtract(bonus).subtract(reward).subtract(earnedPromo));

        WalletRefundRequestedEvent event = WalletRefundRequestedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .eventType(REFUND_REQUESTED)
                .idempotencyKey("escrow:" + escrow.getId() + ":partial-refund:"
                        + gross.toPlainString() + ":" + refundAmount.toPlainString())
                .escrowId(escrow.getId())
                .orderId(escrow.getOrderId())
                .orderItemId(escrow.getOrderItemId())
                .buyerUserId(escrow.getBuyerId())
                .bonusAmount(bonus)
                .rewardAmount(reward)
                .paidAmount(paid)
                .earnedPromoAmount(earnedPromo)
                .occurredAt(Instant.now())
                .build();
        saveOutbox("EscrowTransaction", escrow.getId(), REFUND_REQUESTED, event);
        escrow.setRefundRequestedAt(Instant.now());
        escrow.setNeedsAdminDecision(true);
        escrow.setStatus(EscrowStatus.PENDING_ADMIN_DECISION);
        escrow.setReviewReason(reason);
        escrow.setLastWalletError(null);
        escrowRepository.save(escrow);
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
        } else if ("wallet.refund.succeeded".equals(event.getEventType()) && isPartialRefundResult(event)) {
            applyPartialRefund(escrow, event);
            escrow.setStatus(EscrowStatus.PENDING_ADMIN_DECISION);
            escrow.setRefundedAt(event.getOccurredAt() == null ? Instant.now() : event.getOccurredAt());
            escrow.setNeedsAdminDecision(true);
            escrow.setReviewReason("partial_refund_completed");
            escrow.setLastWalletError(null);
            updateOrderItemState(escrow, EscrowState.PENDING_ADMIN_DECISION, false, "partial_refund_completed");
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
    public List<EscrowTransaction> getAdminEscrows(EscrowStatus status) {
        if (status == null) {
            return escrowRepository.findAllByOrderByCreatedAtDesc();
        }
        return escrowRepository.findByStatusOrderByCreatedAtDesc(status);
    }
    @Transactional(readOnly = true)
    public List<EscrowTransaction> getPendingDecisionEscrows() {
        return escrowRepository.findByNeedsAdminDecisionTrueOrderByUpdatedAtAsc();
    }

    private boolean isPartialRefundResult(WalletEscrowResultEvent event) {
        return event.getIdempotencyKey() != null && event.getIdempotencyKey().contains(":partial-refund:");
    }

    private void ensureWalletActionAllowed(EscrowTransaction escrow, String action) {
        if (escrow.getStatus() == EscrowStatus.RELEASED) {
            throw new IllegalStateException("Escrow has already been released; " + action + " requires a reversal flow");
        }
        if (escrow.getStatus() == EscrowStatus.REFUNDED) {
            throw new IllegalStateException("Escrow has already been refunded");
        }
        if (escrow.getCreditRequestedAt() != null || escrow.getRefundRequestedAt() != null) {
            throw new IllegalStateException("A wallet operation is already in progress for this escrow");
        }
    }

    private void applyPartialRefund(EscrowTransaction escrow, WalletEscrowResultEvent event) {
        BigDecimal bonus = money(zero(event.getBonusAmount()));
        BigDecimal reward = money(zero(event.getRewardAmount()));
        BigDecimal paid = money(zero(event.getPaidAmount()));
        BigDecimal earnedPromo = money(zero(event.getEarnedPromoAmount()));
        BigDecimal refundTotal = bonus.add(reward).add(paid).add(earnedPromo);

        escrow.setBonusBackedAmount(subtractRefund(escrow.getBonusBackedAmount(), bonus, "bonus"));
        escrow.setRewardBackedAmount(subtractRefund(escrow.getRewardBackedAmount(), reward, "reward"));
        escrow.setPaidBackedAmount(subtractRefund(escrow.getPaidBackedAmount(), paid, "paid"));
        escrow.setEarnedPromoBackedAmount(
                subtractRefund(escrow.getEarnedPromoBackedAmount(), earnedPromo, "earned promo"));
        escrow.setGrossAmount(subtractRefund(escrow.getGrossAmount(), refundTotal, "gross"));
        escrow.setPromoBackedAmount(money(zero(escrow.getBonusBackedAmount())
                .add(zero(escrow.getRewardBackedAmount()))
                .add(zero(escrow.getEarnedPromoBackedAmount()))));
        escrow.setRefundRequestedAt(null);
        clearReleaseAmounts(escrow);
    }

    private BigDecimal subtractRefund(BigDecimal current, BigDecimal refund, String source) {
        BigDecimal remaining = money(zero(current).subtract(zero(refund)));
        if (remaining.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalStateException("Wallet refunded more than escrow " + source + " amount");
        }
        return remaining;
    }

    private void clearReleaseAmounts(EscrowTransaction escrow) {
        escrow.setTierAtRelease(null);
        escrow.setTierFeePercent(null);
        escrow.setEscrowFeePercent(null);
        escrow.setTeacherWithdrawableNet(null);
        escrow.setTeacherPromoNet(null);
        escrow.setPlatformFeeReal(null);
        escrow.setPlatformFeePromoSink(null);
    }
    private BigDecimal zero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
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
            item.setEscrowNeedsReview(false);
            item.setEscrowReviewReason(null);
            orderItemRepository.save(item);
        });
    }

    private void logAdminAction(String adminId, String actionType, String targetType,
                                String targetId, String reason, String metadata) {
        if (adminActionLogService != null) {
            adminActionLogService.logAction(adminId, actionType, targetType, targetId, reason, metadata);
        }
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


