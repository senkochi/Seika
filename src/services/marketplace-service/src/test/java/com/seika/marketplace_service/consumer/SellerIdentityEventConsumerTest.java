package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.service.SellerIdentityProjectionService;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class SellerIdentityEventConsumerTest {

    @Test
    void consumesRegisteredAndSnapshotEventShape() {
        SellerIdentityProjectionService projectionService =
                mock(SellerIdentityProjectionService.class);
        SellerIdentityEventConsumer consumer = new SellerIdentityEventConsumer(
                new ObjectMapper().findAndRegisterModules(),
                projectionService);

        consumer.handle("""
                {
                  "eventId":"event-1",
                  "eventType":"user.registered",
                  "userId":"teacher-1",
                  "payload":{"username":"lan.nguyen","roles":["TEACHER"]}
                }
                """);

        verify(projectionService).sync("teacher-1", "lan.nguyen");
    }

    @Test
    void ignoresEventWithoutUsername() {
        SellerIdentityProjectionService projectionService =
                mock(SellerIdentityProjectionService.class);
        SellerIdentityEventConsumer consumer = new SellerIdentityEventConsumer(
                new ObjectMapper().findAndRegisterModules(),
                projectionService);

        consumer.handle("""
                {"eventId":"event-2","userId":"teacher-1","payload":{}}
                """);

        verify(projectionService, never()).sync(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString());
    }
}
