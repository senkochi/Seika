package com.seika.profile_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // ── Content events exchange (quiz-service & flashcard-service publish here) ──
    public static final String CONTENT_EVENTS_EXCHANGE = "content.events";

    // Routing keys published by quiz-service / flashcard-service
    public static final String QUIZ_SET_CREATED_ROUTING_KEY = "quiz.set.created";
    public static final String FLASHCARD_SET_CREATED_ROUTING_KEY = "flashcard.set.created";

    // profile-service consumer queues
    public static final String PROFILE_QUIZ_SET_CREATED_QUEUE = "profile.quiz-set-created";
    public static final String PROFILE_FLASHCARD_SET_CREATED_QUEUE = "profile.flashcard-set-created";

    // ── Marketplace events exchange ──
    public static final String MARKETPLACE_EVENTS_EXCHANGE = "marketplace.events";
    public static final String CONTENT_PURCHASED_ROUTING_KEY = "content.purchased";
    public static final String PROFILE_CONTENT_PURCHASED_QUEUE = "profile.content-purchased";

    @Bean
    public TopicExchange contentEventsExchange() {
        return new TopicExchange(CONTENT_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange marketplaceEventsExchange() {
        return new TopicExchange(MARKETPLACE_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public Queue profileQuizSetCreatedQueue() {
        return new Queue(PROFILE_QUIZ_SET_CREATED_QUEUE, true);
    }

    @Bean
    public Queue profileFlashcardSetCreatedQueue() {
        return new Queue(PROFILE_FLASHCARD_SET_CREATED_QUEUE, true);
    }

    @Bean
    public Queue profileContentPurchasedQueue() {
        return new Queue(PROFILE_CONTENT_PURCHASED_QUEUE, true);
    }

    @Bean
    public Binding quizSetCreatedBinding(Queue profileQuizSetCreatedQueue, TopicExchange contentEventsExchange) {
        return BindingBuilder.bind(profileQuizSetCreatedQueue)
                .to(contentEventsExchange)
                .with(QUIZ_SET_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding flashcardSetCreatedBinding(Queue profileFlashcardSetCreatedQueue, TopicExchange contentEventsExchange) {
        return BindingBuilder.bind(profileFlashcardSetCreatedQueue)
                .to(contentEventsExchange)
                .with(FLASHCARD_SET_CREATED_ROUTING_KEY);
    }

    @Bean
    public Binding contentPurchasedBinding(Queue profileContentPurchasedQueue, TopicExchange marketplaceEventsExchange) {
        return BindingBuilder.bind(profileContentPurchasedQueue)
                .to(marketplaceEventsExchange)
                .with(CONTENT_PURCHASED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}

