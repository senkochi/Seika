package com.seika.reward_service.consumer;

import com.seika.reward_service.config.RabbitMQConfig;
import com.seika.reward_service.event.DeckCompletedEvent;
import com.seika.reward_service.event.QuizCompletedEvent;
import com.seika.reward_service.processor.RewardProcessor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventConsumer {

    private final RewardProcessor rewardProcessor;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_REWARD_DECK_COMPLETED)
    public void handleDeckCompletedEvent(DeckCompletedEvent event) {
        try {
            rewardProcessor.processDeckCompleted(event);
        } catch (Exception e) {
            log.error("Error processing DeckCompletedEvent: {}", event, e);
            // In a real system, you might want to throw an exception to trigger DLQ
            // or save to an error table.
        }
    }

    @RabbitListener(queues = RabbitMQConfig.QUEUE_REWARD_QUIZ_COMPLETED)
    public void handleQuizCompletedEvent(QuizCompletedEvent event) {
        try {
            rewardProcessor.processQuizCompleted(event);
        } catch (Exception e) {
            log.error("Error processing QuizCompletedEvent: {}", event, e);
        }
    }
}
