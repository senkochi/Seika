package com.seika.identity_service.config;

import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String USER_REGISTERED_EXCHANGE = "identity.events";

    @Bean
    public TopicExchange userRegisteredExchange() {
        return new TopicExchange(USER_REGISTERED_EXCHANGE);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
      return new JacksonJsonMessageConverter();
    }
}