package com.seika.marketplace_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class CollusionRiskScanJob {

    private final CollusionFlagService collusionFlagService;

    @Scheduled(cron = "${collusion.scan.cron:0 0 3 * * *}")
    public void scanRecentEscrows() {
        int created = collusionFlagService.scanRecentEscrowsForCollusion();
        if (created > 0) {
            log.info("Created {} collusion flags from scheduled risk scan", created);
        }
    }
}
