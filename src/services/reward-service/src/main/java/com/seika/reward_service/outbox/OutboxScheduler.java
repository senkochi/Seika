package com.seika.reward_service.outbox;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class OutboxScheduler {

    private final OutboxEventRepository outboxEventRepository;
    private final RabbitTemplate rabbitTemplate;

    public static final String EXCHANGE_LEARNING_EVENTS = "learning.events";
    public static final String ROUTING_KEY_REWARD_GRANTED = "reward.granted";

    @Scheduled(fixedDelay = 5000)
    @Transactional
    public void processOutboxEvents() {
        List<OutboxEvent> events = outboxEventRepository.findAllByOrderByCreatedAtAsc();

        for (OutboxEvent event : events) {
            try {
                // Here we send the raw JSON string payload directly. 
                // Alternatively, we could deserialize it back to RewardGrantedEvent.
                // We'll deserialize to take advantage of Jackson converter in RabbitTemplate.
                Object payload = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
                
                // Using Spring's MessageConverter implicitly by sending the JSON payload.
                // To keep it simple, we use convertAndSend with the String payload and set content type.
                org.springframework.amqp.core.MessageProperties props = new org.springframework.amqp.core.MessageProperties();
                props.setContentType("application/json");
                org.springframework.amqp.core.Message message = new org.springframework.amqp.core.Message(event.getPayload().getBytes(), props);
                
                rabbitTemplate.send(EXCHANGE_LEARNING_EVENTS, ROUTING_KEY_REWARD_GRANTED, message);
                
                log.info("Published outbox event id: {}", event.getId());
                outboxEventRepository.delete(event);
            } catch (Exception e) {
                log.error("Failed to publish outbox event id: {}", event.getId(), e);
            }
        }
    }
}
