package com.cardy.walletService.consumer;

import com.cardy.walletService.event.CollusionFlaggedEvent;
import com.cardy.walletService.service.WalletHoldService;
import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageProperties;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

class CollusionEventConsumerTest {

    @Test
    void confirmedFlagPlacesTeacherWashHoldUsingEventHoldDays() throws Exception {
        WalletHoldService holdService = mock(WalletHoldService.class);
        WalletService walletService = mock(WalletService.class);
        CollusionEventConsumer consumer = new CollusionEventConsumer(holdService, walletService);

        UUID teacherId = UUID.randomUUID();
        UUID buyerId = UUID.randomUUID();
        CollusionFlaggedEvent event = CollusionFlaggedEvent.builder()
                .flagId("FLAG-1")
                .teacherId(teacherId.toString())
                .buyerId(buyerId.toString())
                .status("CONFIRMED")
                .reason("wash trading")
                .holdDays(14)
                .build();

        consumer.handleCollusionFlaggedEvent(message(event));

        verify(holdService).placeHold(eq(teacherId), eq("WASH_HOLD"), any(),
                eq("FLAG-1"), eq("SYSTEM_COLLUSION"), any(LocalDateTime.class));
        verify(walletService, never()).applyFreeze(any(), any(), any(), any());
    }

    @Test
    void maliciousFlagFreezesTeacherAndBuyerWallets() throws Exception {
        WalletHoldService holdService = mock(WalletHoldService.class);
        WalletService walletService = mock(WalletService.class);
        CollusionEventConsumer consumer = new CollusionEventConsumer(holdService, walletService);

        UUID teacherId = UUID.randomUUID();
        UUID buyerId = UUID.randomUUID();
        CollusionFlaggedEvent event = CollusionFlaggedEvent.builder()
                .flagId("FLAG-2")
                .teacherId(teacherId.toString())
                .buyerId(buyerId.toString())
                .status("MALICIOUS")
                .reason("malicious abuse")
                .holdDays(30)
                .build();

        consumer.handleCollusionFlaggedEvent(message(event));

        verify(walletService).applyFreeze(teacherId, "Collusion flag MALICIOUS: malicious abuse",
                "FLAG-2", "SYSTEM_COLLUSION");
        verify(walletService).applyFreeze(buyerId, "Collusion flag MALICIOUS: malicious abuse",
                "FLAG-2", "SYSTEM_COLLUSION");
        verify(holdService, never()).placeHold(any(), any(), any(), any(), any(), any());
    }

    @Test
    void handleCollusionFlaggedMaliciousWithoutBuyerIdRethrows() throws Exception {
        WalletHoldService holdService = mock(WalletHoldService.class);
        WalletService walletService = mock(WalletService.class);
        CollusionEventConsumer consumer = new CollusionEventConsumer(holdService, walletService);

        UUID teacherId = UUID.randomUUID();
        CollusionFlaggedEvent event = CollusionFlaggedEvent.builder()
                .flagId("FLAG-3")
                .teacherId(teacherId.toString())
                .buyerId(null)
                .status("MALICIOUS")
                .reason("malicious abuse")
                .holdDays(30)
                .build();

        assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.handleCollusionFlaggedEvent(message(event)));

        verify(walletService, never()).applyFreeze(any(), any(), any(), any());
        verify(holdService, never()).placeHold(any(), any(), any(), any(), any(), any());
    }

    @Test
    void handleCollusionFlaggedWithPoisonPayloadRethrows() {
        WalletHoldService holdService = mock(WalletHoldService.class);
        WalletService walletService = mock(WalletService.class);
        CollusionEventConsumer consumer = new CollusionEventConsumer(holdService, walletService);

        Message poison = new Message("{not json".getBytes(StandardCharsets.UTF_8), new MessageProperties());

        assertThrows(AmqpRejectAndDontRequeueException.class,
                () -> consumer.handleCollusionFlaggedEvent(poison));

        verify(walletService, never()).applyFreeze(any(), any(), any(), any());
        verify(holdService, never()).placeHold(any(), any(), any(), any(), any(), any());
    }

    private static Message message(CollusionFlaggedEvent event) throws Exception {
        byte[] body = new ObjectMapper().writeValueAsBytes(event);
        return new Message(body, new MessageProperties());
    }
}
