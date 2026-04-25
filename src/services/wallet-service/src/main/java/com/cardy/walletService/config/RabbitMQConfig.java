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

    @Bean
    public FanoutExchange learnExchange() { return new FanoutExchange(LEARN_FANOUT_EXCHANGE); }

    @Bean
    public Queue walletQueue() { return new Queue(WALLET_QUEUE); }

    @Bean
    public Binding walletBinding(Queue walletQueue, FanoutExchange learnFanoutExchange) {
        return BindingBuilder.bind(walletQueue).to(learnFanoutExchange);
    }

    @Bean
    public MessageConverter jsonMessageConverter() { return new JacksonJsonMessageConverter(); }
}
