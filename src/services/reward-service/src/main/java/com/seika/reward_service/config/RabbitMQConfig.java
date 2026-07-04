package com.seika.reward_service.config;

import com.seika.reward_service.event.DeckCompletedEvent;
import com.seika.reward_service.event.QuizCompletedEvent;
import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.DefaultJackson2JavaTypeMapper;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_LEARNING_EVENTS = "learning.events";
    public static final String QUEUE_REWARD_DECK_COMPLETED = "reward.deck.completed";
    public static final String QUEUE_REWARD_QUIZ_COMPLETED = "reward.quiz.completed";
    
    public static final String ROUTING_KEY_DECK_COMPLETED = "deck.completed";
    public static final String ROUTING_KEY_QUIZ_COMPLETED = "quiz.completed";

    @Bean
    public TopicExchange learningEventsExchange() {
        return new TopicExchange(EXCHANGE_LEARNING_EVENTS);
    }

    @Bean
    public Queue rewardDeckCompletedQueue() {
        return new Queue(QUEUE_REWARD_DECK_COMPLETED, true);
    }

    @Bean
    public Queue rewardQuizCompletedQueue() {
        return new Queue(QUEUE_REWARD_QUIZ_COMPLETED, true);
    }

    @Bean
    public Binding bindingRewardDeckCompletedQueue() {
        return BindingBuilder.bind(rewardDeckCompletedQueue()).to(learningEventsExchange()).with(ROUTING_KEY_DECK_COMPLETED);
    }

    @Bean
    public Binding bindingRewardQuizCompletedQueue() {
        return BindingBuilder.bind(rewardQuizCompletedQueue()).to(learningEventsExchange()).with(ROUTING_KEY_QUIZ_COMPLETED);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        Jackson2JsonMessageConverter converter = new Jackson2JsonMessageConverter();

        DefaultJackson2JavaTypeMapper typeMapper = new DefaultJackson2JavaTypeMapper();
        // Trust all packages so deserialization works cross-service
        typeMapper.setTrustedPackages("*");
        // Map incoming type headers to local event classes
        Map<String, Class<?>> idClassMapping = new HashMap<>();
        idClassMapping.put("com.seika.flashcard_service.dto.DeckCompletedEvent", DeckCompletedEvent.class);
        idClassMapping.put("com.seika.quiz_service.event.QuizCompletedEvent", QuizCompletedEvent.class);
        // Also handle plain class names (without package) as fallback
        idClassMapping.put("DeckCompletedEvent", DeckCompletedEvent.class);
        idClassMapping.put("QuizCompletedEvent", QuizCompletedEvent.class);
        typeMapper.setIdClassMapping(idClassMapping);

        converter.setJavaTypeMapper(typeMapper);
        return converter;
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }
}
