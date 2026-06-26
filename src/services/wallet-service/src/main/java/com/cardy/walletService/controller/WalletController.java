package com.cardy.walletService.controller;

import com.cardy.walletService.dto.TransactionReqDTO;
import com.cardy.walletService.service.WalletService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {
    @Autowired
    private WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@AuthenticationPrincipal Jwt jwt){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        BigDecimal balance = walletService.getBalance(userId);
        return ResponseEntity.ok(balance);
    }

    @PostMapping("/reward")
    public ResponseEntity<?> reward(@AuthenticationPrincipal Jwt jwt,
                                        @RequestBody TransactionReqDTO req) {
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.reward(userId, req);
        return ResponseEntity.ok("Nhận thưởng thành công");
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(@AuthenticationPrincipal Jwt jwt,
                                      @RequestBody TransactionReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.spend(userId, req);
        return ResponseEntity.ok(Map.of("message", "Trừ tiền thành công"));
    }

    @PostMapping("/cash-out")
    public ResponseEntity<?> cashOut(@AuthenticationPrincipal Jwt jwt,
                                     @RequestBody TransactionReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.cashOut(userId, req.getAmount(), req.getDescription());
        return ResponseEntity.ok(Map.of("message", "Rút tiền thành công"));
    }

    @PostMapping("/deposit")
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
