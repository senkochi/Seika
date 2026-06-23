package com.cardy.walletService.controller;

import com.cardy.walletService.dto.TransactionReqDTO;
import com.cardy.walletService.dto.TransactionDTO;
import com.cardy.walletService.service.WalletService;
import com.cardy.walletService.shared.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
public class WalletController {
    @Autowired
    private WalletService walletService;

    @GetMapping("/balance")
    public ResponseEntity<ApiResponse<BigDecimal>> getBalance(@AuthenticationPrincipal Jwt jwt){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        BigDecimal balance = walletService.getBalance(userId);
        return ResponseEntity.ok(ApiResponse.success(balance));
    }

    @PostMapping("/reward")
    public ResponseEntity<ApiResponse<Void>> reward(@AuthenticationPrincipal Jwt jwt,
                                        @RequestBody TransactionReqDTO req) {
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.reward(userId, req);
        return ResponseEntity.ok(ApiResponse.success(null, "Nhận thưởng thành công"));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<Map<String, String>>> withdraw(@AuthenticationPrincipal Jwt jwt,
                                      @RequestBody TransactionReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaimAsString("userId"));
        walletService.spend(userId, req);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "Trừ tiền thành công")));
    }

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<Void>> deposit(@AuthenticationPrincipal Jwt jwt,
                                     @RequestBody TransactionReqDTO req){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        walletService.deposit(userId, req);
        return ResponseEntity.ok(ApiResponse.success(null, "Nạp tiền thành công"));
    }

    @PostMapping("/history")
    public ResponseEntity<ApiResponse<List<TransactionDTO>>> getHistory(@AuthenticationPrincipal Jwt jwt){
        UUID userId = UUID.fromString(jwt.getClaim("userId"));
        return ResponseEntity.ok(ApiResponse.success(walletService.getHistory(userId)));
    }
}
