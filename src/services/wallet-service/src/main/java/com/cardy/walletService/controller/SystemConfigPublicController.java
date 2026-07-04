package com.cardy.walletService.controller;

import com.cardy.walletService.entity.SystemConfig;
import com.cardy.walletService.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/wallet/configs")
@RequiredArgsConstructor
public class SystemConfigPublicController {

    private final SystemConfigService systemConfigService;

    @GetMapping
    public ResponseEntity<List<SystemConfig>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAll());
    }
}
