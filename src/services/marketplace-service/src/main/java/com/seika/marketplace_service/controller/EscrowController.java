package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.entity.EscrowTransaction;
import com.seika.marketplace_service.enums.EscrowStatus;
import com.seika.marketplace_service.service.EscrowService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/marketplace")
@RequiredArgsConstructor
public class EscrowController {
    private final EscrowService escrowService;

    @GetMapping("/escrows/me")
    public ResponseEntity<List<EscrowTransaction>> getMyEscrows() {
        return ResponseEntity.ok(escrowService.getMyEscrows(resolveUserId()));
    }

    @GetMapping("/escrows/seller/me")
    public ResponseEntity<List<EscrowTransaction>> getMySellerEscrows() {
        return ResponseEntity.ok(escrowService.getSellerPendingEscrows(resolveUserId()));
    }

    @PostMapping("/escrows/{escrowId}/refund")
    public ResponseEntity<EscrowTransaction> selfServiceRefund(@PathVariable String escrowId) {
        return ResponseEntity.ok(escrowService.requestSelfServiceRefund(resolveUserId(), escrowId));
    }

    @GetMapping("/admin/escrows")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EscrowTransaction>> adminEscrows(@RequestParam(required = false) EscrowStatus status) {
        return ResponseEntity.ok(escrowService.getAdminEscrows(status));
    }

    @GetMapping("/admin/orders/pending-decision")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EscrowTransaction>> pendingDecision() {
        return ResponseEntity.ok(escrowService.getPendingDecisionEscrows());
    }

    @PostMapping("/admin/order-items/{orderItemId}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscrowTransaction> adminRefund(@PathVariable String orderItemId,
                                                         @RequestBody(required = false) AdminDecisionRequest request,
                                                         HttpServletRequest httpRequest) {
        return ResponseEntity.ok(escrowService.adminFullRefund(orderItemId, resolveAdminId(httpRequest), request == null ? null : request.getReason()));
    }

    @PostMapping("/admin/order-items/{orderItemId}/force-release")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscrowTransaction> adminForceRelease(@PathVariable String orderItemId,
                                                               @RequestBody(required = false) AdminDecisionRequest request,
                                                               HttpServletRequest httpRequest) {
        return ResponseEntity.ok(escrowService.adminForceRelease(orderItemId, resolveAdminId(httpRequest), request == null ? null : request.getReason()));
    }

    @PostMapping("/admin/order-items/{orderItemId}/no-refund")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EscrowTransaction> adminNoRefund(@PathVariable String orderItemId,
                                                           @RequestBody(required = false) AdminDecisionRequest request,
                                                           HttpServletRequest httpRequest) {
        return ResponseEntity.ok(escrowService.adminNoRefund(orderItemId, resolveAdminId(httpRequest), request == null ? null : request.getReason()));
    }

    private static String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getPrincipal() == null || auth.getPrincipal().toString().isBlank()) {
            throw new IllegalStateException("User not authenticated");
        }
        return auth.getPrincipal().toString();
    }

    private static String resolveAdminId(HttpServletRequest request) {
        String header = request.getHeader("X-User-Id");
        return header == null || header.isBlank() ? resolveUserId() : header;
    }

    @Data
    public static class AdminDecisionRequest {
        private String reason;
    }
}