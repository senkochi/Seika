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
    public void handleRewardGrantedEvent(RewardGrantedEvent event) {
        log.info("Received RewardGrantedEvent for user {}, exp: {}", event.getUserId(), event.getExp());
        
        if (event.getExp() == null || event.getExp() <= 0) {
            return;
        }

        try {
            userProfileService.addExp(event.getUserId(), event.getExp());
            log.info("Added {} exp to profile of user {}", event.getExp(), event.getUserId());
        } catch (Exception e) {
            log.error("Failed to add exp to profile of user {}", event.getUserId(), e);
        }
    }
}
