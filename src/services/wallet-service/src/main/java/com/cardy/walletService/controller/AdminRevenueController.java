package com.cardy.walletService.controller;

import com.cardy.walletService.dto.admin.AdminRevenueStatsDTO;
import com.cardy.walletService.dto.admin.AdminTransactionDTO;
import com.cardy.walletService.service.AdminRevenueService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wallet/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminRevenueController {

    private final AdminRevenueService adminRevenueService;

    @GetMapping("/revenue-stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminRevenueStatsDTO> getRevenueStats() {
        log.info("Admin request revenue stats");
        return ResponseEntity.ok(adminRevenueService.getRevenueStats());
    }

    @GetMapping("/transactions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<AdminTransactionDTO>> getSystemTransactions(
            @RequestParam(required = false, defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Admin request system transactions with type={}, page={}, size={}", type, page, size);
        return ResponseEntity.ok(adminRevenueService.getSystemTransactions(type, page, size));
    }
}
