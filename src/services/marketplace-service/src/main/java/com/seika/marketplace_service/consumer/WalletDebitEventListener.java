package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.event.WalletDebitEvent;
import com.seika.marketplace_service.service.WalletEventHandler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WalletDebitEventListener {

    private final ObjectMapper objectMapper;
    private final WalletEventHandler walletEventHandler;

    @RabbitListener(queues = "${messaging.events.wallet-queue:marketplace.wallet-events}")
    public void handleWalletDebitEvent(String rawMessage) {
        try {
            WalletDebitEvent event = objectMapper.readValue(rawMessage, WalletDebitEvent.class);
            walletEventHandler.handleWalletDebitEvent(event, rawMessage);
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize wallet.debit message. payload={}", rawMessage, exception);
        } catch (Exception exception) {
            log.error("Failed to process wallet.debit message. payload={}", rawMessage, exception);
            throw exception;
        }
    }
}
