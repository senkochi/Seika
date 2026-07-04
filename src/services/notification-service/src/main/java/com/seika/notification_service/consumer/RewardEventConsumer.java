package com.seika.notification_service.consumer;

import com.seika.notification_service.config.RabbitMQConfig;
import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.entity.NotificationChannel;
import com.seika.notification_service.entity.NotificationType;
import com.seika.notification_service.event.RewardGrantedEvent;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RewardEventConsumer {

    private final NotificationService notificationService;

    @RabbitListener(queues = RabbitMQConfig.NOTIFICATION_REWARD_QUEUE)
    public void handleRewardGrantedEvent(RewardGrantedEvent event) {
        log.info("Received RewardGrantedEvent for user {}, coins: {}, exp: {}", event.getUserId(), event.getCoins(), event.getExp());

        String message = String.format("Bạn đã nhận được %d Coin và %d EXP từ việc hoàn thành %s!", event.getCoins(), event.getExp(), event.getSource());
        
        CreateNotificationRequest notificationReq = CreateNotificationRequest.builder()
                .userId(event.getUserId())
                .title("Nhận thưởng thành công")
                .content(message)
                .type(NotificationType.SYSTEM)
                .channel(NotificationChannel.IN_APP)
                .build();

        try {
            notificationService.createNotification(notificationReq);
            log.info("Sent reward notification to user {}", event.getUserId());
        } catch (Exception e) {
            log.error("Failed to send reward notification to user {}", event.getUserId(), e);
        }
    }
}
