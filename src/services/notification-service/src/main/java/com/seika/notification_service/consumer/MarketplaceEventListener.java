package com.seika.notification_service.consumer;

import com.seika.notification_service.config.RabbitMQConfig;
import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.entity.NotificationType;
import com.seika.notification_service.event.ContentPurchasedEvent;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;

@Component
@RequiredArgsConstructor
@Slf4j
public class MarketplaceEventListener {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.MARKETPLACE_QUEUE)
    public void handleContentPurchasedEvent(String rawMessage) {
        try {
            ContentPurchasedEvent event = objectMapper.readValue(rawMessage, ContentPurchasedEvent.class);
            log.info("Received ContentPurchasedEvent for order {}", event.getOrderId());

            // 1. Notify Buyer (Student)
            if (event.getBuyerUserId() != null) {
                String studentTitle = "Purchase Successful 🎉";
                String prodNameStr = (event.getProductName() != null && !event.getProductName().isBlank())
                    ? " '" + event.getProductName() + "'" : "";
                String typeStr = (event.getProductType() != null) ? 
                    ("FLASHCARD".equalsIgnoreCase(event.getProductType()) ? "Flashcard" : 
                    "QUIZ".equalsIgnoreCase(event.getProductType()) ? "Quiz" : event.getProductType()) : "sản phẩm";
                String studentMessage = String.format("Bạn đã mua %s%s thành công với giá %s Coins.", 
                    typeStr, prodNameStr,
                    event.getPrice() != null ? event.getPrice().toString() : "0");

                CreateNotificationRequest studentReq = CreateNotificationRequest.builder()
                    .userId(event.getBuyerUserId())
                    .title(studentTitle)
                    .content(studentMessage)
                    .type(NotificationType.ORDER_COMPLETED)
                    .eventId("student_purchase_" + event.getOrderId())
                    .build();
                try {
                    notificationService.createNotification(studentReq);
                } catch (Exception e) {
                    log.error("Failed to create notification for student {}", event.getBuyerUserId(), e);
                }
            }

            // 2. Notify Seller (Teacher)
            if (event.getTeacherUserId() != null) {
                String teacherTitle = "New Sale! 💰";
                String prodNameStr = (event.getProductName() != null && !event.getProductName().isBlank())
                    ? " '" + event.getProductName() + "'" : "";
                String typeStr = (event.getProductType() != null) ? 
                    ("FLASHCARD".equalsIgnoreCase(event.getProductType()) ? "Flashcard" : 
                    "QUIZ".equalsIgnoreCase(event.getProductType()) ? "Quiz" : event.getProductType()) : "sản phẩm";
                String teacherMessage = String.format("Học sinh vừa mua %s%s của bạn. Bạn nhận được %s Coins.", 
                    typeStr, prodNameStr,
                    event.getPrice() != null ? event.getPrice().toString() : "0");

                CreateNotificationRequest teacherReq = CreateNotificationRequest.builder()
                    .userId(event.getTeacherUserId())
                    .title(teacherTitle)
                    .content(teacherMessage)
                    .type(NotificationType.ORDER_COMPLETED)
                    .eventId("teacher_sale_" + event.getOrderId())
                    .build();
                try {
                    notificationService.createNotification(teacherReq);
                } catch (Exception e) {
                    log.error("Failed to create notification for teacher {}", event.getTeacherUserId(), e);
                }
            }
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize content.purchased message. payload={}", rawMessage, exception);
            throw new AmqpRejectAndDontRequeueException("Invalid content.purchased payload", exception);
        } catch (Exception exception) {
            log.error("Failed to process content.purchased message. payload={}", rawMessage, exception);
            throw exception;
        }
    }
}
