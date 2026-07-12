package com.seika.marketplace_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.marketplace_service.event.WalletDebitEvent;
import com.seika.marketplace_service.event.WalletEscrowResultEvent;
import com.seika.marketplace_service.service.EscrowService;
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
    private final EscrowService escrowService;

    @RabbitListener(queues = "${messaging.events.wallet-queue:marketplace.wallet-events}")
    public void handleWalletEvent(String rawMessage) {
        try {
            JsonNode root = objectMapper.readTree(rawMessage);
            String eventType = root.path("eventType").asText();
            if (eventType.startsWith("wallet.debit.")) {
                WalletDebitEvent event = objectMapper.treeToValue(root, WalletDebitEvent.class);
                walletEventHandler.handleWalletDebitEvent(event, rawMessage);
            } else if (eventType.startsWith("wallet.credit.") || eventType.startsWith("wallet.refund.")) {
                WalletEscrowResultEvent event = objectMapper.treeToValue(root, WalletEscrowResultEvent.class);
                escrowService.handleWalletEscrowResult(event);
            } else {
                log.warn("Ignoring unsupported wallet eventType={}", eventType);
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize wallet message. payload={}", rawMessage, exception);
        } catch (Exception exception) {
            log.error("Failed to process wallet message. payload={}", rawMessage, exception);
            throw exception;
        }
    }
}
