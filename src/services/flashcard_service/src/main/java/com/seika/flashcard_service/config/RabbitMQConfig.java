package com.seika.flashcard_service.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String LEARN_FANOUT_EXCHANGE = "learn.exchange";
    public static final String LEARN_QUEUE = "learn.queue";
    public static final String WALLET_QUEUE = "wallet.queue";

    @Bean
    public FanoutExchange learnExchange() { return new FanoutExchange(LEARN_FANOUT_EXCHANGE); }

    @Bean
    public Queue learnQueue() { return new Queue(LEARN_QUEUE); }

    @Bean
    public Queue walletQueue() { return new Queue(WALLET_QUEUE); }

    @Bean
    public Binding learnBinding(Queue learnQueue, FanoutExchange learnFanoutExchange) {
        return BindingBuilder.bind(learnQueue).to(learnFanoutExchange);
    }

    @Bean
    public Binding walletBinding(Queue walletQueue, FanoutExchange learnFanoutExchange) {
        return BindingBuilder.bind(walletQueue).to(learnFanoutExchange);
    }

    @Bean
    public MessageConverter jsonMessageConverter() { return new JacksonJsonMessageConverter(); }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory){
        final RabbitTemplate rabbitTemplate = new RabbitTemplate(connectionFactory);
        rabbitTemplate.setMessageConverter(jsonMessageConverter());
        return rabbitTemplate;
    }
}
