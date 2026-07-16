package com.cardy.walletService.repository;

import com.cardy.walletService.domain.WalletOutboxEvent;
import com.cardy.walletService.enums.WalletOutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WalletOutboxEventRepository extends JpaRepository<WalletOutboxEvent, UUID> {
    List<WalletOutboxEvent> findTop50ByStatusInOrderByCreatedAtAsc(List<WalletOutboxStatus> statuses);
}