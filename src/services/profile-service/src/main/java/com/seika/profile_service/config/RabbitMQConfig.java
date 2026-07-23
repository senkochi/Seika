package com.seika.profile_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Content events exchange (quiz-service and flashcard-service publish here)
    public static final String CONTENT_EVENTS_EXCHANGE = "content.events";
    public static final String QUIZ_SET_CREATED_ROUTING_KEY = "quiz.set.created";
    public static final String FLASHCARD_SET_CREATED_ROUTING_KEY = "flashcard.set.created";

    // Marketplace events exchange
    public static final String MARKETPLACE_EVENTS_EXCHANGE = "marketplace.events";
    public static final String CONTENT_PURCHASED_ROUTING_KEY = "content.purchased";
    public static final String TEACHER_TIER_UPDATED_ROUTING_KEY = "teacher.tier.updated";

    // Identity events exchange
    public static final String IDENTITY_EVENTS_EXCHANGE = "identity.events";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";

    // Learning events exchange
    public static final String LEARNING_EVENTS_EXCHANGE = "learning.events";
    public static final String REWARD_GRANTED_ROUTING_KEY = "reward.granted";

    // profile-service consumer queues
    public static final String PROFILE_QUIZ_SET_CREATED_QUEUE = "profile.quiz-set-created";
    public static final String PROFILE_FLASHCARD_SET_CREATED_QUEUE = "profile.flashcard-set-created";
    public static final String PROFILE_CONTENT_PURCHASED_QUEUE = "profile.content-purchased";
    public static final String PROFILE_TEACHER_TIER_UPDATED_QUEUE = "profile.teacher-tier-updated";
    public static final String PROFILE_USER_REGISTERED_QUEUE = "profile.user-registered";
    public static final String PROFILE_REWARD_QUEUE = "profile.reward-events";

    @Bean
    public TopicExchange contentEventsExchange() {
        return new TopicExchange(CONTENT_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange marketplaceEventsExchange() {
        return new TopicExchange(MARKETPLACE_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange identityEventsExchange() {
        return new TopicExchange(IDENTITY_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange learningEventsExchange() {
        return new TopicExchange(LEARNING_EVENTS_EXCHANGE, true, false);
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
    public Queue profileTeacherTierUpdatedQueue() {
        return new Queue(PROFILE_TEACHER_TIER_UPDATED_QUEUE, true);
    }

    @Bean
    public Queue profileUserRegisteredQueue() {
        return new Queue(PROFILE_USER_REGISTERED_QUEUE, true);
    }

    @Bean
    public Queue profileRewardQueue() {
        return new Queue(PROFILE_REWARD_QUEUE, true);
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
    public Binding teacherTierUpdatedBinding(Queue profileTeacherTierUpdatedQueue, TopicExchange marketplaceEventsExchange) {
        return BindingBuilder.bind(profileTeacherTierUpdatedQueue)
                .to(marketplaceEventsExchange)
                .with(TEACHER_TIER_UPDATED_ROUTING_KEY);
    }

    @Bean
    public Binding profileUserRegisteredBinding(Queue profileUserRegisteredQueue, TopicExchange identityEventsExchange) {
        return BindingBuilder.bind(profileUserRegisteredQueue)
                .to(identityEventsExchange)
                .with(USER_REGISTERED_ROUTING_KEY);
    }

    @Bean
    public Binding profileRewardBinding(Queue profileRewardQueue, TopicExchange learningEventsExchange) {
        return BindingBuilder.bind(profileRewardQueue)
                .to(learningEventsExchange)
                .with(REWARD_GRANTED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
