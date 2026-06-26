package com.seika.quiz_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String CONTENT_EVENTS_EXCHANGE = "content.events";
    public static final String QUIZ_SET_CREATED_ROUTING_KEY = "quiz.set.created";

    // Learning events (for rewards)
    public static final String LEARNING_EVENTS_EXCHANGE = "learning.events";
    public static final String QUIZ_COMPLETED_ROUTING_KEY = "quiz.completed";

    @Bean
    public TopicExchange contentEventsExchange() {
        return new TopicExchange(CONTENT_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange learningEventsExchange() {
        return new TopicExchange(LEARNING_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}

