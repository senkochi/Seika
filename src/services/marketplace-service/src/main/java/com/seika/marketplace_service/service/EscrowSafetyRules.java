package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.EscrowState;

import java.time.Instant;
import java.util.List;

final class EscrowSafetyRules {

    static final List<EscrowState> UNRESOLVED_ESCROW_STATES = List.of(
            EscrowState.HELD,
            EscrowState.PENDING_ADMIN_DECISION,
            EscrowState.CANCELLED_BY_ADMIN
    );

    private EscrowSafetyRules() {
    }

    static void markPendingDecision(OrderItem item, String reason) {
        item.setEscrowState(EscrowState.PENDING_ADMIN_DECISION);
        item.setEscrowNeedsReview(true);
        item.setEscrowReviewReason(reason);
    }

    static void cancelByAdmin(OrderItem item, String reason, String adminUserId, Instant decisionAt) {
        item.setEscrowState(EscrowState.CANCELLED_BY_ADMIN);
        item.setEscrowNeedsReview(true);
        item.setEscrowReviewReason(reason);
        item.setAdminDecisionAt(decisionAt);
        item.setAdminDecisionBy(adminUserId);
        item.setAdminDecisionReason(reason);
    }
}
