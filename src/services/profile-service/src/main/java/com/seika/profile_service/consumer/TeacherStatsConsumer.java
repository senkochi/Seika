package com.seika.profile_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.profile_service.config.RabbitMQConfig;
import com.seika.profile_service.enity.GameProfile;
import com.seika.profile_service.enity.TeacherProfile;
import com.seika.profile_service.event.ContentPurchasedEvent;
import com.seika.profile_service.event.FlashcardSetCreatedEvent;
import com.seika.profile_service.event.QuizSetCreatedEvent;
import com.seika.profile_service.repository.GameProfileRepository;
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
    private final GameProfileRepository gameProfileRepository;
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
            ensureTeacherProfileExists(event.getCreatedBy());
            teacherProfileRepository.incrementQuizCreated(event.getCreatedBy());
            addTeacherExp(event.getCreatedBy(), 100L);
            log.info("Incremented totalQuizCreated and awarded 100 EXP for teacherId={}", event.getCreatedBy());
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
            ensureTeacherProfileExists(event.getCreatedBy());
            teacherProfileRepository.incrementFlashcardsCreated(event.getCreatedBy());
            addTeacherExp(event.getCreatedBy(), 80L);
            log.info("Incremented totalFlashcardsCreated and awarded 80 EXP for teacherId={}", event.getCreatedBy());
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
            ensureTeacherProfileExists(event.getTeacherUserId());
            teacherProfileRepository.incrementStudentsReached(event.getTeacherUserId());
            addTeacherExp(event.getTeacherUserId(), 50L);
            log.info("Incremented totalStudentsReached and awarded 50 EXP for teacherId={} (purchasedBy={})",
                    event.getTeacherUserId(), event.getBuyerUserId());
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize content.purchased message. payload={}", rawMessage, e);
        } catch (Exception e) {
            log.error("Failed to process content.purchased message. payload={}", rawMessage, e);
        }
    }

    private void ensureTeacherProfileExists(String userId) {
        if (!teacherProfileRepository.existsByUserId(userId)) {
            TeacherProfile newProfile = TeacherProfile.builder()
                    .userId(userId)
                    .totalQuizCreated(0)
                    .totalFlashcardsCreated(0)
                    .totalStudentsReached(0)
                    .build();
            teacherProfileRepository.save(newProfile);
            log.info("Lazy-created TeacherProfile for userId={}", userId);
        }
    }

    private void addTeacherExp(String userId, long expAmount) {
        GameProfile gameProfile = gameProfileRepository.findByUserId(userId)
                .orElseGet(() -> GameProfile.builder()
                        .userId(userId)
                        .exp(0)
                        .level(1)
                        .build());

        long oldExp = gameProfile.getExp();
        long newExp = oldExp + expAmount;
        gameProfile.setExp(newExp);

        int oldLevel = gameProfile.getLevel();
        int newLevel = (int) (newExp / 100) + 1;
        if (newLevel > oldLevel) {
            gameProfile.setLevel(newLevel);
            log.info("Teacher userId={} leveled up! {} -> {}", userId, oldLevel, newLevel);
        }

        gameProfileRepository.save(gameProfile);
    }
}

