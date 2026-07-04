package com.seika.notification_service.consumer;

import com.seika.notification_service.client.IdentityClient;
import com.seika.notification_service.config.RabbitMQConfig;
import com.seika.notification_service.dto.CreateNotificationRequest;
import com.seika.notification_service.entity.NotificationType;
import com.seika.notification_service.event.ContentCreatedEvent;
import com.seika.notification_service.event.ContentPurchasedEvent;
import com.seika.notification_service.event.ContentReviewedEvent;
import com.seika.notification_service.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.AmqpRejectAndDontRequeueException;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class MarketplaceEventListener {

    private final NotificationService notificationService;
    private final IdentityClient identityClient;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.MARKETPLACE_QUEUE)
    public void handleMarketplaceEvent(String rawMessage, @Header(required = false, name = AmqpHeaders.RECEIVED_ROUTING_KEY) String routingKey) {
        log.info("[Marketplace Listener] Received message with routingKey='{}', body length={}", routingKey, rawMessage != null ? rawMessage.length() : 0);
        log.debug("[Marketplace Listener] Message body: {}", rawMessage);

        try {
            if (routingKey != null && routingKey.startsWith("content.reviewed")) {
                handleContentReviewed(rawMessage);
                return;
            }
            if (routingKey != null && routingKey.startsWith("content.created")) {
                handleContentCreated(rawMessage);
                return;
            }
            handleContentPurchased(rawMessage);
        } catch (JsonProcessingException exception) {
            log.error("Failed to deserialize marketplace message. routingKey={}, payload={}", routingKey, rawMessage, exception);
            throw new AmqpRejectAndDontRequeueException("Invalid marketplace payload", exception);
        } catch (Exception exception) {
            log.error("Failed to process marketplace message. routingKey={}, payload={}", routingKey, rawMessage, exception);
            throw new AmqpRejectAndDontRequeueException("Failed to process marketplace event", exception);
        }
    }

    private void handleContentReviewed(String rawMessage) throws JsonProcessingException {
        ContentReviewedEvent event = objectMapper.readValue(rawMessage, ContentReviewedEvent.class);
        log.info("Parsed ContentReviewedEvent: productId={}, status={}, teacherUserId={}", event.getProductId(), event.getStatus(), event.getTeacherUserId());

        if (event.getTeacherUserId() == null) {
            log.warn("ContentReviewedEvent has null teacherUserId, skipping notification. Event: {}", rawMessage);
            return;
        }

        String prodNameStr = (event.getProductName() != null && !event.getProductName().isBlank())
                ? " '" + event.getProductName() + "'" : "";
        String typeStr = (event.getProductType() != null) ?
                ("FLASHCARD".equalsIgnoreCase(event.getProductType()) ? "Flashcard" :
                        "QUIZ".equalsIgnoreCase(event.getProductType()) ? "Quiz" : event.getProductType()) : "sản phẩm";

        String title;
        String content;
        if ("PUBLISHED".equalsIgnoreCase(event.getStatus())) {
            title = "Duyệt bài thành công ✅";
            content = String.format("Sản phẩm %s%s của bạn đã được quản trị viên duyệt và xuất bản lên cửa hàng.", typeStr, prodNameStr);
        } else {
            title = "Duyệt bài thất bại ❌";
            String reason = (event.getRejectionReason() != null && !event.getRejectionReason().isBlank())
                    ? event.getRejectionReason() : "Không đạt yêu cầu chất lượng.";
            content = String.format("Sản phẩm %s%s của bạn đã bị từ chối xuất bản. Lý do: %s", typeStr, prodNameStr, reason);
        }

        CreateNotificationRequest req = CreateNotificationRequest.builder()
                .userId(event.getTeacherUserId())
                .title(title)
                .content(content)
                .type(NotificationType.CONTENT_REVIEWED)
                .eventId("content_reviewed_" + (event.getEventId() != null ? event.getEventId() : UUID.randomUUID().toString()))
                .build();
        try {
            notificationService.createNotification(req);
            log.info("Sent CONTENT_REVIEWED notification to teacher {}", event.getTeacherUserId());
        } catch (Exception e) {
            log.error("Failed to create CONTENT_REVIEWED notification for teacher {}", event.getTeacherUserId(), e);
        }
    }

    private void handleContentCreated(String rawMessage) throws JsonProcessingException {
        ContentCreatedEvent event = objectMapper.readValue(rawMessage, ContentCreatedEvent.class);
        log.info("Parsed ContentCreatedEvent: productId={}, type={}, teacherUserId={}", event.getProductId(), event.getProductType(), event.getTeacherUserId());

        String prodNameStr = (event.getProductName() != null && !event.getProductName().isBlank())
                ? " '" + event.getProductName() + "'" : "";
        String typeStr = (event.getProductType() != null) ?
                ("FLASHCARD".equalsIgnoreCase(event.getProductType()) ? "Flashcard" :
                        "QUIZ".equalsIgnoreCase(event.getProductType()) ? "Quiz" : event.getProductType()) : "sản phẩm";

        List<String> adminUserIds = identityClient.getAdminUserIds();
        log.info("Retrieved {} admin user IDs for content.created notification", adminUserIds.size());
        if (adminUserIds.isEmpty()) {
            log.warn("No admin users found to notify for ContentCreatedEvent {}", event.getProductId());
            return;
        }

        String title = "Có bài đăng mới cần duyệt 📋";
        String content = String.format("Giáo viên vừa tạo %s%s. Vui lòng kiểm tra và duyệt bài.", typeStr, prodNameStr);

        for (String adminId : adminUserIds) {
            CreateNotificationRequest req = CreateNotificationRequest.builder()
                    .userId(adminId)
                    .title(title)
                    .content(content)
                    .type(NotificationType.CONTENT_CREATED)
                    .eventId("content_created_" + (event.getEventId() != null ? event.getEventId() : UUID.randomUUID().toString()) + "_" + adminId)
                    .build();
            try {
                notificationService.createNotification(req);
                log.info("Sent CONTENT_CREATED notification to admin {}", adminId);
            } catch (Exception e) {
                log.error("Failed to create CONTENT_CREATED notification for admin {}", adminId, e);
            }
        }
    }

    private void handleContentPurchased(String rawMessage) throws JsonProcessingException {
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
    }
}
