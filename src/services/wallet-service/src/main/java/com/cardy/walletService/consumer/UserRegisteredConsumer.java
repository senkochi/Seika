package com.cardy.walletService.consumer;

import com.cardy.walletService.config.RabbitMQConfig;
import com.cardy.walletService.service.WalletService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredConsumer {

    private final WalletService walletService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.USER_REGISTERED_QUEUE)
    @Transactional
    public void handleUserRegistered(String rawMessage) {
        try {
            com.cardy.walletService.event.UserRegisteredEvent event =
                    objectMapper.readValue(rawMessage, com.cardy.walletService.event.UserRegisteredEvent.class);

            if (event.getUserId() == null || event.getUserId().isBlank()) {
                log.warn("Skipped user.registered event because userId is empty");
                return;
            }

            UUID userId = UUID.fromString(event.getUserId());
            
            boolean isTeacher = false;
            if (event.getPayload() != null && event.getPayload().containsKey("roles")) {
                Object rolesObj = event.getPayload().get("roles");
                if (rolesObj instanceof java.util.List) {
                    isTeacher = ((java.util.List<?>) rolesObj).contains("TEACHER");
                }
            }
            
            walletService.createWallet(userId, isTeacher);
            log.info("Created wallet for new userId={}, isTeacher={}", userId, isTeacher);
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize user.registered message. payload={}", rawMessage, exception);
        } catch (Exception exception) {
            log.error("Failed to process user.registered message. payload={}", rawMessage, exception);
        }
    }
}
