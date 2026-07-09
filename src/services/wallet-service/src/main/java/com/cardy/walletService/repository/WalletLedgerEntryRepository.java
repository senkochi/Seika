package com.cardy.walletService.repository;

import com.cardy.walletService.domain.WalletLedgerEntry;
import com.cardy.walletService.enums.WalletLedgerType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WalletLedgerEntryRepository extends JpaRepository<WalletLedgerEntry, UUID> {
    Optional<WalletLedgerEntry> findFirstByIdempotencyKey(String idempotencyKey);
    List<WalletLedgerEntry> findByTypeInOrderByCreatedAtDesc(List<WalletLedgerType> types);
    List<WalletLedgerEntry> findAllByOrderByCreatedAtDesc();
}
