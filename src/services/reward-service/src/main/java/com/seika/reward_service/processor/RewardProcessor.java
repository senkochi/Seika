package com.seika.reward_service.processor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.reward_service.entity.LearningRewardLog;
import com.seika.reward_service.entity.RewardType;
import com.seika.reward_service.event.DeckCompletedEvent;
import com.seika.reward_service.event.QuizCompletedEvent;
import com.seika.reward_service.event.RewardGrantedEvent;
import com.seika.reward_service.outbox.OutboxEvent;
import com.seika.reward_service.outbox.OutboxEventRepository;
import com.seika.reward_service.repository.LearningRewardLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RewardProcessor {

    private final LearningRewardLogRepository learningRewardLogRepository;
    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    @Value("${reward.flashcard.coins}")
    private Integer flashcardCoins;

    @Value("${reward.flashcard.exp}")
    private Integer flashcardExp;

    @Value("${reward.flashcard.cooldown-days}")
    private Integer flashcardCooldownDays;

    @Value("${reward.quiz.easy.coins}")
    private Integer quizEasyCoins;

    @Value("${reward.quiz.easy.exp}")
    private Integer quizEasyExp;

    @Value("${reward.quiz.medium.coins}")
    private Integer quizMediumCoins;

    @Value("${reward.quiz.medium.exp}")
    private Integer quizMediumExp;

    @Value("${reward.quiz.hard.coins}")
    private Integer quizHardCoins;

    @Value("${reward.quiz.hard.exp}")
    private Integer quizHardExp;


    @Transactional
    public void processDeckCompleted(DeckCompletedEvent event) {
        log.info("Processing DeckCompletedEvent for user: {} and deck: {}", event.getUserId(), event.getDeckId());

        LocalDateTime now = LocalDateTime.now();

        Optional<LearningRewardLog> logOptional = learningRewardLogRepository
                .findByUserIdAndRewardTypeAndItemId(event.getUserId(), RewardType.FLASHCARD, event.getDeckId());

        if (logOptional.isPresent()) {
            LearningRewardLog rewardLog = logOptional.get();
            LocalDateTime nextRewardTime = rewardLog.getLastRewardAt().plusDays(flashcardCooldownDays);

            if (now.isBefore(nextRewardTime)) {
                log.info("Cooldown active for user {} on deck {}. Next reward available at {}", event.getUserId(), event.getDeckId(), nextRewardTime);
                return;
            }

            rewardLog.setRewardCount(rewardLog.getRewardCount() + 1);
            rewardLog.setLastRewardAt(now);
            learningRewardLogRepository.save(rewardLog);
        } else {
            LearningRewardLog rewardLog = LearningRewardLog.builder()
                    .userId(event.getUserId())
                    .rewardType(RewardType.FLASHCARD)
                    .itemId(event.getDeckId())
                    .rewardCount(1)
                    .lastRewardAt(now)
                    .build();
            learningRewardLogRepository.save(rewardLog);
        }

        log.info("Granting flashcard reward to user {} for deck {}", event.getUserId(), event.getDeckId());
        grantReward(event.getUserId(), flashcardCoins, flashcardExp, "FLASHCARD", event.getDeckId(), event.getCorrelationId());
    }

    @Transactional
    public void processQuizCompleted(QuizCompletedEvent event) {
        log.info("Processing QuizCompletedEvent for user: {} and quiz: {}", event.getUserId(), event.getQuizId());

        if (event.getPassed() == null || !event.getPassed()) {
            log.info("Quiz not passed for user: {}", event.getUserId());
            return;
        }

        Optional<LearningRewardLog> logOptional = learningRewardLogRepository
                .findByUserIdAndRewardTypeAndItemId(event.getUserId(), RewardType.QUIZ, event.getQuizId());

        if (logOptional.isPresent()) {
            log.info("User {} has already received reward for quiz {}", event.getUserId(), event.getQuizId());
            return;
        }

        LocalDateTime now = LocalDateTime.now();
        LearningRewardLog rewardLog = LearningRewardLog.builder()
                .userId(event.getUserId())
                .rewardType(RewardType.QUIZ)
                .itemId(event.getQuizId())
                .rewardCount(1)
                .lastRewardAt(now)
                .build();
        learningRewardLogRepository.save(rewardLog);

        // TODO: Map quiz difficulty from Quiz Service properly. Defaulting to Medium for now.
        Integer coins = quizMediumCoins;
        Integer exp = quizMediumExp;

        grantReward(event.getUserId(), coins, exp, "QUIZ", event.getQuizId(), event.getCorrelationId());
    }

    private void grantReward(String userId, Integer coins, Integer exp, String source, String itemId, String correlationId) {
        RewardGrantedEvent grantedEvent = RewardGrantedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .correlationId(correlationId)
                .userId(userId)
                .coins(coins)
                .exp(exp)
                .source(source)
                .itemId(itemId)
                .build();

        try {
            OutboxEvent outboxEvent = OutboxEvent.builder()
                    .aggregateType("Reward")
                    .aggregateId(userId)
                    .eventType("RewardGrantedEvent")
                    .payload(objectMapper.writeValueAsString(grantedEvent))
                    .build();
            outboxEventRepository.save(outboxEvent);
            log.info("Saved RewardGrantedEvent to outbox for user {}", userId);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize RewardGrantedEvent", e);
            throw new RuntimeException("Failed to serialize RewardGrantedEvent", e);
        }
    }
}
