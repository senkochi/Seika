package com.seika.marketplace_service.controller;

import com.seika.marketplace_service.dto.CollusionActionRequest;
import com.seika.marketplace_service.entity.CollusionFlag;
import com.seika.marketplace_service.enums.CollusionFlagStatus;
import com.seika.marketplace_service.repository.CollusionFlagRepository;
import com.seika.marketplace_service.service.CollusionFlagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/marketplace/admin/collusion-flags")
@RequiredArgsConstructor
@Slf4j
public class AdminCollusionController {

    private final CollusionFlagService collusionFlagService;
    private final CollusionFlagRepository collusionFlagRepository;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<CollusionFlag>> listFlags(
            @RequestParam(required = false) CollusionFlagStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Admin list collusion flags status={} page={} size={}", status, page, size);
        PageRequest pageable = PageRequest.of(page, size);
        if (status != null) {
            return ResponseEntity.ok(collusionFlagRepository.findByStatusOrderByCreatedAtDesc(status, pageable));
        }
        return ResponseEntity.ok(collusionFlagRepository.findAll(pageable));
    }

    @PostMapping("/{flagId}/action")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CollusionFlag> takeAction(
            @PathVariable String flagId,
            @Valid @RequestBody CollusionActionRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "SYSTEM_ADMIN") String adminId) {
        log.info("Admin action on collusion flag {} — action: {}, reason: {}", flagId, request.getAction(), request.getReason());
        CollusionFlag result = switch (request.getAction().toUpperCase()) {
            case "CONFIRM_COLLUSION" -> collusionFlagService.confirmCollusion(flagId, adminId, request.getReason());
            case "MARK_MALICIOUS" -> collusionFlagService.markMalicious(flagId, adminId, request.getReason());
            case "DISMISS" -> collusionFlagService.dismissFlag(flagId, adminId, request.getReason());
            default -> throw new IllegalArgumentException("Unknown action: " + request.getAction());
        };
        return ResponseEntity.ok(result);
    }
}
