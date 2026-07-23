package com.seika.marketplace_service.repository;

import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.enums.EscrowStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface EscrowTransactionRepository extends JpaRepository<EscrowTransaction, String> {
    @Override
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EscrowTransaction> findById(String id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<EscrowTransaction> findByOrderItemId(String orderItemId);
    Optional<EscrowTransaction> findByOrderIdAndOrderItemId(String orderId, String orderItemId);
    List<EscrowTransaction> findByOrderId(String orderId);
    List<EscrowTransaction> findByBuyerIdAndStatusInOrderByCreatedAtDesc(String buyerId, List<EscrowStatus> statuses);
    List<EscrowTransaction> findBySellerIdAndStatusInOrderByCreatedAtDesc(String sellerId, List<EscrowStatus> statuses);
    List<EscrowTransaction> findByStatusOrderByCreatedAtDesc(EscrowStatus status);
    List<EscrowTransaction> findAllByOrderByCreatedAtDesc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<EscrowTransaction> findByStatusAndNeedsAdminDecisionFalseAndReleaseAtLessThanEqualAndCreditRequestedAtIsNullAndRefundRequestedAtIsNull(EscrowStatus status, Instant now);
    List<EscrowTransaction> findByNeedsAdminDecisionTrueOrderByUpdatedAtAsc();
    List<EscrowTransaction> findBySellerId(String sellerId);
    List<EscrowTransaction> findByCreatedAtBetween(Instant start, Instant end);
    List<EscrowTransaction> findBySellerIdAndBuyerIdAndCreatedAtBetween(String sellerId, String buyerId, Instant start, Instant end);
}