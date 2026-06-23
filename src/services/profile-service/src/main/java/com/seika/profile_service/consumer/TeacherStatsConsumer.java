package com.seika.profile_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.profile_service.config.RabbitMQConfig;
import com.seika.profile_service.event.ContentPurchasedEvent;
import com.seika.profile_service.event.FlashcardSetCreatedEvent;
import com.seika.profile_service.event.QuizSetCreatedEvent;
import com.seika.profile_service.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class TeacherStatsConsumer {

    private final TeacherProfileRepository teacherProfileRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.PROFILE_QUIZ_SET_CREATED_QUEUE)
    @Transactional
    public void handleQuizSetCreated(String rawMessage) {
        try {
            QuizSetCreatedEvent event = objectMapper.readValue(rawMessage, QuizSetCreatedEvent.class);
            if (event.getCreatedBy() == null || event.getCreatedBy().isBlank()) {
                log.warn("Skipped quiz.set.created event – createdBy is empty");
                return;
            }
            if (!teacherProfileRepository.existsByUserId(event.getCreatedBy())) {
                log.warn("Skipped quiz.set.created – no TeacherProfile for userId={}", event.getCreatedBy());
                return;
            }
            teacherProfileRepository.incrementQuizCreated(event.getCreatedBy());
            log.info("Incremented totalQuizCreated for teacherId={}", event.getCreatedBy());
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize quiz.set.created message. payload={}", rawMessage, e);
        } catch (Exception e) {
            log.error("Failed to process quiz.set.created message. payload={}", rawMessage, e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.PROFILE_FLASHCARD_SET_CREATED_QUEUE)
    @Transactional
    public void handleFlashcardSetCreated(String rawMessage) {
        try {
            FlashcardSetCreatedEvent event = objectMapper.readValue(rawMessage, FlashcardSetCreatedEvent.class);
            if (event.getCreatedBy() == null || event.getCreatedBy().isBlank()) {
                log.warn("Skipped flashcard.set.created event – createdBy is empty");
                return;
            }
            if (!teacherProfileRepository.existsByUserId(event.getCreatedBy())) {
                log.warn("Skipped flashcard.set.created – no TeacherProfile for userId={}", event.getCreatedBy());
                return;
            }
            teacherProfileRepository.incrementFlashcardsCreated(event.getCreatedBy());
            log.info("Incremented totalFlashcardsCreated for teacherId={}", event.getCreatedBy());
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize flashcard.set.created message. payload={}", rawMessage, e);
        } catch (Exception e) {
            log.error("Failed to process flashcard.set.created message. payload={}", rawMessage, e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.PROFILE_CONTENT_PURCHASED_QUEUE)
    @Transactional
    public void handleContentPurchased(String rawMessage) {
        try {
            ContentPurchasedEvent event = objectMapper.readValue(rawMessage, ContentPurchasedEvent.class);
            if (event.getTeacherUserId() == null || event.getTeacherUserId().isBlank()) {
                log.warn("Skipped content.purchased event – teacherUserId is empty");
                return;
            }
            if (!teacherProfileRepository.existsByUserId(event.getTeacherUserId())) {
                log.warn("Skipped content.purchased – no TeacherProfile for userId={}", event.getTeacherUserId());
                return;
            }
            teacherProfileRepository.incrementStudentsReached(event.getTeacherUserId());
            log.info("Incremented totalStudentsReached for teacherId={} (purchasedBy={})",
                    event.getTeacherUserId(), event.getBuyerUserId());
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize content.purchased message. payload={}", rawMessage, e);
        } catch (Exception e) {
            log.error("Failed to process content.purchased message. payload={}", rawMessage, e);
        }
    }
}

