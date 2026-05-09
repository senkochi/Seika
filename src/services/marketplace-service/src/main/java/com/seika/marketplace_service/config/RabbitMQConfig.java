package com.seika.marketplace_service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String WALLET_EVENTS_EXCHANGE = "wallet.events";
    public static final String WALLET_EVENTS_QUEUE = "marketplace.wallet-events";
    public static final String WALLET_EVENTS_ROUTING_KEY = "wallet.debit.*";
    public static final String WALLET_COMMANDS_EXCHANGE = "wallet.commands";
    public static final String WALLET_DEBIT_ROUTING_KEY = "wallet.debit.requested";

    @Bean
    public TopicExchange walletEventsExchange() {
        return new TopicExchange(WALLET_EVENTS_EXCHANGE);
    }

    @Bean
    public Queue walletEventsQueue() {
        return new Queue(WALLET_EVENTS_QUEUE, true);
    }

    @Bean
    public Binding walletEventsBinding(Queue walletEventsQueue, TopicExchange walletEventsExchange) {
        return BindingBuilder
            .bind(walletEventsQueue)
            .to(walletEventsExchange)
            .with(WALLET_EVENTS_ROUTING_KEY);
    }

    @Bean
    public TopicExchange walletCommandsExchange() {
        return new TopicExchange(WALLET_COMMANDS_EXCHANGE);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
