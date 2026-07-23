package com.seika.identity_service.service;

import com.seika.identity_service.dto.admin.PublicIdentitySnapshotResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        name = "messaging.events.public-identity-reconciliation.enabled",
        havingValue = "true",
        matchIfMissing = true)
@Slf4j
public class PublicIdentitySnapshotScheduler {

    private final PublicIdentitySnapshotService snapshotService;
    private final int batchSize;

    public PublicIdentitySnapshotScheduler(
            PublicIdentitySnapshotService snapshotService,
            @Value("${messaging.events.public-identity-reconciliation.batch-size:500}")
                    int batchSize) {
        this.snapshotService = snapshotService;
        this.batchSize = batchSize;
    }

    @Scheduled(
            initialDelayString =
                    "${messaging.events.public-identity-reconciliation.initial-delay-ms:30000}",
            fixedDelayString =
                    "${messaging.events.public-identity-reconciliation.delay-ms:86400000}")
    public void reconcile() {
        int page = 0;
        int published = 0;

        try {
            PublicIdentitySnapshotResponse response;
            do {
                response = snapshotService.publishPage(page, batchSize);
                published += response.getPublished();
                page++;
            } while (page < response.getTotalPages());

            log.info("Completed public identity reconciliation published={}", published);
        } catch (RuntimeException exception) {
            log.error(
                    "Public identity reconciliation failed after published={}; scheduled retry will run later",
                    published,
                    exception);
        }
    }
}
