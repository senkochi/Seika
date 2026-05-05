package com.cardy.walletService.config;

import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.MessageConverter;

@Configuration
public class RabbitMQConfig {
    public static final String LEARN_FANOUT_EXCHANGE = "learn.exchange";
    public static final String WALLET_QUEUE = "wallet.queue";
    public static final String IDENTITY_EVENTS_EXCHANGE = "identity.events";
    public static final String USER_REGISTERED_QUEUE = "wallet.user-events";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";

    @Bean
    public FanoutExchange learnExchange() { return new FanoutExchange(LEARN_FANOUT_EXCHANGE); }

    @Bean
    public Queue walletQueue() { return new Queue(WALLET_QUEUE); }

    @Bean
    public Binding walletBinding(Queue walletQueue, FanoutExchange learnFanoutExchange) {
        return BindingBuilder.bind(walletQueue).to(learnFanoutExchange);
    }

    @Bean
    public TopicExchange identityEventsExchange() {
        return new TopicExchange(IDENTITY_EVENTS_EXCHANGE);
    }

    @Bean
    public Queue userRegisteredQueue() {
        return new Queue(USER_REGISTERED_QUEUE);
    }

    @Bean
    public Binding userRegisteredBinding(Queue userRegisteredQueue, TopicExchange identityEventsExchange) {
        return BindingBuilder.bind(userRegisteredQueue)
                .to(identityEventsExchange)
                .with(USER_REGISTERED_ROUTING_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() { return new JacksonJsonMessageConverter(); }
}
