package com.cardy.walletService.controller;

import com.cardy.walletService.dto.TopUpDTO;
import com.cardy.walletService.dto.TopUpReqDTO;
import com.cardy.walletService.dto.TransactionReqDTO;
import com.cardy.walletService.service.WalletService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
@Slf4j
public class WalletController {
    @Autowired
    private WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@AuthenticationPrincipal Jwt jwt){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        BigDecimal balance = walletService.getBalance(userId);
        return ResponseEntity.ok(balance);
    }

    @GetMapping("/balance/breakdown")
    public ResponseEntity<?> getBalanceBreakdown(@AuthenticationPrincipal Jwt jwt){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        return ResponseEntity.ok(walletService.getBalanceBreakdown(userId));
    }

    @PostMapping("/cash-out")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<?> cashOut(@AuthenticationPrincipal Jwt jwt,
                                     @RequestBody TransactionReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.cashOut(userId, req.getAmount(), req.getDescription());
        return ResponseEntity.ok(Map.of("message", "Rút tiền thành công"));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@AuthenticationPrincipal Jwt jwt,
                                      @RequestBody TransactionReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.spend(userId, req);
        return ResponseEntity.ok(Map.of("message", "Thanh toán thành công"));
    }

    @PostMapping("/top-up")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TopUpDTO> topUp(@AuthenticationPrincipal Jwt jwt,
                                          @Valid @RequestBody TopUpReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        TopUpDTO res = walletService.topUp(userId, req);
        return ResponseEntity.ok(res);
    }

    @PostMapping("/deposit")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deposit(@AuthenticationPrincipal Jwt jwt,
                                     @RequestBody TransactionReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.deposit(userId, req);
        return ResponseEntity.ok("Nạp tiền thành công");
    }

    @PostMapping("/history")
    public ResponseEntity<?> getHistory(@AuthenticationPrincipal Jwt jwt){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        return ResponseEntity.ok(walletService.getHistory(userId));
    }
}
