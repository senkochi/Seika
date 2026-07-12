package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.enums.EscrowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EscrowTransactionRepository extends JpaRepository<EscrowTransaction, String> {
    Optional<EscrowTransaction> findByOrderItemId(String orderItemId);
    Optional<EscrowTransaction> findByOrderIdAndOrderItemId(String orderId, String orderItemId);
    List<EscrowTransaction> findByOrderId(String orderId);
    List<EscrowTransaction> findByBuyerIdAndStatusInOrderByCreatedAtDesc(String buyerId, List<EscrowStatus> statuses);
    List<EscrowTransaction> findBySellerIdAndStatusInOrderByCreatedAtDesc(String sellerId, List<EscrowStatus> statuses);
    List<EscrowTransaction> findByStatusAndNeedsAdminDecisionFalseAndReleaseAtLessThanEqualAndCreditRequestedAtIsNullAndRefundRequestedAtIsNull(EscrowStatus status, Instant now);
    List<EscrowTransaction> findByNeedsAdminDecisionTrueOrderByUpdatedAtAsc();
}
