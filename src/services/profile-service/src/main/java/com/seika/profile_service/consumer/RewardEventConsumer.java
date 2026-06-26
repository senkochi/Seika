package com.seika.profile_service.consumer;

import com.seika.profile_service.config.RabbitMQConfig;
import com.seika.profile_service.event.RewardGrantedEvent;
import com.seika.profile_service.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RewardEventConsumer {

    private final UserProfileService userProfileService;

    @RabbitListener(queues = RabbitMQConfig.PROFILE_REWARD_QUEUE)
    public void handleRewardGrantedEvent(org.springframework.amqp.core.Message message) {
        try {
            String body = new String(message.getBody());
            log.info("Received raw RewardGrantedEvent message: {}", body);
            
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            mapper.registerModule(new com.fasterxml.jackson.datatype.jsr310.JavaTimeModule());
            mapper.configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
            
            RewardGrantedEvent event = mapper.readValue(body, RewardGrantedEvent.class);
            log.info("Received RewardGrantedEvent for user {}, exp: {}", event.getUserId(), event.getExp());
            
            if (event.getExp() == null || event.getExp() <= 0) {
                return;
            }
            
            userProfileService.addExp(event.getUserId(), event.getExp());
            log.info("Added {} exp to profile of user {}", event.getExp(), event.getUserId());
        } catch (Exception e) {
            log.error("Failed to process RewardGrantedEvent", e);
        }
    }
}
