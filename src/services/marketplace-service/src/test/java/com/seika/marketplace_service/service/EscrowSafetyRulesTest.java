package com.seika.marketplace_service.service;

import com.seika.marketplace_service.entity.OrderItem;
import com.seika.marketplace_service.enums.EscrowState;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;

class EscrowSafetyRulesTest {

    @Test
    void editDuringHeldMarksItemPendingAdminDecision() {
        OrderItem item = OrderItem.builder()
                .escrowState(EscrowState.HELD)
                .build();

        EscrowSafetyRules.markPendingDecision(item, "content_edit_by_teacher");

        assertThat(item.getEscrowState()).isEqualTo(EscrowState.PENDING_ADMIN_DECISION);
        assertThat(item.isEscrowNeedsReview()).isTrue();
        assertThat(item.getEscrowReviewReason()).isEqualTo("content_edit_by_teacher");
    }

    @Test
    void adminRejectOrHideCancelsHeldItemWithoutRefundingAutomatically() {
        OrderItem item = OrderItem.builder()
                .escrowState(EscrowState.HELD)
                .escrowFullyRefunded(false)
                .build();
        Instant decisionAt = Instant.parse("2026-07-09T00:00:00Z");

        EscrowSafetyRules.cancelByAdmin(item, "admin_reject_or_hide", "admin-1", decisionAt);

        assertThat(item.getEscrowState()).isEqualTo(EscrowState.CANCELLED_BY_ADMIN);
        assertThat(item.isEscrowNeedsReview()).isTrue();
        assertThat(item.isEscrowFullyRefunded()).isFalse();
        assertThat(item.getAdminDecisionAt()).isEqualTo(decisionAt);
        assertThat(item.getAdminDecisionBy()).isEqualTo("admin-1");
        assertThat(item.getAdminDecisionReason()).isEqualTo("admin_reject_or_hide");
    }

    @Test
    void hardDeleteGuardStatesCoverAllUnresolvedEscrowStates() {
        assertThat(EscrowSafetyRules.UNRESOLVED_ESCROW_STATES).containsExactly(
                EscrowState.HELD,
                EscrowState.PENDING_ADMIN_DECISION,
                EscrowState.CANCELLED_BY_ADMIN
        );
    }
}
