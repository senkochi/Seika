package com.seika.reward_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.reward_service.config.RabbitMQConfig;
import com.seika.reward_service.event.DeckCompletedEvent;
import com.seika.reward_service.event.QuizCompletedEvent;
import com.seika.reward_service.processor.RewardProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventConsumer {

    private final RewardProcessor rewardProcessor;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_REWARD_DECK_COMPLETED)
    public void handleDeckCompletedEvent(Message message) {
        try {
            String body = new String(message.getBody());
            log.info("Received DeckCompletedEvent raw message: {}", body);
            DeckCompletedEvent event = objectMapper.readValue(body, DeckCompletedEvent.class);
            rewardProcessor.processDeckCompleted(event);
        } catch (Exception e) {
            log.error("Error processing DeckCompletedEvent: {}", e.getMessage(), e);
        }
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_REWARD_QUIZ_COMPLETED)
    public void handleQuizCompletedEvent(Message message) {
        try {
            String body = new String(message.getBody());
            log.info("Received QuizCompletedEvent raw message: {}", body);
            QuizCompletedEvent event = objectMapper.readValue(body, QuizCompletedEvent.class);
            rewardProcessor.processQuizCompleted(event);
        } catch (Exception e) {
            log.error("Error processing QuizCompletedEvent: {}", e.getMessage(), e);
        }
    }
}
