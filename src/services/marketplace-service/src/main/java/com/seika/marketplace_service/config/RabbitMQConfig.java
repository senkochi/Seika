package com.seika.marketplace_service.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String WALLET_EVENTS_EXCHANGE = "wallet.events";
    public static final String WALLET_EVENTS_QUEUE = "marketplace.wallet-events";
    public static final String WALLET_EVENTS_ROUTING_KEY = "wallet.debit.*";
    public static final String WALLET_CREDIT_EVENTS_ROUTING_KEY = "wallet.credit.*";
    public static final String WALLET_REFUND_EVENTS_ROUTING_KEY = "wallet.refund.*";
    public static final String WALLET_COMMANDS_EXCHANGE = "wallet.commands";
    public static final String WALLET_DEBIT_ROUTING_KEY = "wallet.debit.requested";

    // Marketplace events (published after a successful purchase)
    public static final String MARKETPLACE_EVENTS_EXCHANGE = "marketplace.events";
    public static final String CONTENT_PURCHASED_ROUTING_KEY = "content.purchased";
    public static final String TEACHER_TIER_UPDATED_ROUTING_KEY = "teacher.tier.updated";
    public static final String COLLUSION_FLAGGED_ROUTING_KEY = "collusion.flagged";

    @Bean
    public TopicExchange marketplaceEventsExchange() {
        return new TopicExchange(MARKETPLACE_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public TopicExchange walletEventsExchange() {
        return new TopicExchange(WALLET_EVENTS_EXCHANGE);
    }

    @Bean
    public Queue walletEventsQueue() {
        return new Queue(WALLET_EVENTS_QUEUE, true);
    }

    @Bean
    public TopicExchange identityEventsExchange(
            @Value("${messaging.events.identity-exchange:identity.events}") String exchangeName) {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue marketplaceIdentityEventsQueue(
            @Value("${messaging.events.marketplace-identity-queue:marketplace.identity-events}")
                    String queueName) {
        return new Queue(queueName, true);
    }

    @Bean
    public Binding marketplaceUserRegisteredBinding(
            Queue marketplaceIdentityEventsQueue,
            TopicExchange identityEventsExchange,
            @Value("${messaging.events.user-registered-routing-key:user.registered}")
                    String routingKey) {
        return BindingBuilder.bind(marketplaceIdentityEventsQueue)
                .to(identityEventsExchange)
                .with(routingKey);
    }

    @Bean
    public Binding marketplacePublicIdentitySnapshotBinding(
            Queue marketplaceIdentityEventsQueue,
            TopicExchange identityEventsExchange,
            @Value("${messaging.events.public-identity-snapshot-routing-key:user.public-identity.snapshot}")
                    String routingKey) {
        return BindingBuilder.bind(marketplaceIdentityEventsQueue)
                .to(identityEventsExchange)
                .with(routingKey);
    }

    @Bean
    public Binding walletEventsBinding(Queue walletEventsQueue, TopicExchange walletEventsExchange) {
        return BindingBuilder
            .bind(walletEventsQueue)
            .to(walletEventsExchange)
            .with(WALLET_EVENTS_ROUTING_KEY);
    }

    @Bean
    public Binding walletCreditEventsBinding(Queue walletEventsQueue, TopicExchange walletEventsExchange) {
        return BindingBuilder.bind(walletEventsQueue).to(walletEventsExchange).with(WALLET_CREDIT_EVENTS_ROUTING_KEY);
    }

    @Bean
    public Binding walletRefundEventsBinding(Queue walletEventsQueue, TopicExchange walletEventsExchange) {
        return BindingBuilder.bind(walletEventsQueue).to(walletEventsExchange).with(WALLET_REFUND_EVENTS_ROUTING_KEY);
    }

    // Content events
    public static final String CONTENT_EVENTS_EXCHANGE = "content.events";
    public static final String MARKETPLACE_CONTENT_EVENTS_QUEUE = "marketplace.content-events";

    @Bean
    public TopicExchange contentEventsExchange() {
        return new TopicExchange(CONTENT_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public Queue marketplaceContentEventsQueue(
            @Value("${messaging.events.marketplace-content-queue:marketplace.content-events}")
                    String queueName) {
        return new Queue(queueName, true);
    }

    @Bean
    public Binding marketplaceContentEventsBinding(Queue marketplaceContentEventsQueue, TopicExchange contentEventsExchange) {
        return BindingBuilder
                .bind(marketplaceContentEventsQueue)
                .to(contentEventsExchange)
                .with("*.*.created"); // catches flashcard.set.created and quiz.set.created
    }

    @Bean
    public Binding marketplaceContentEventsUpdateBinding(Queue marketplaceContentEventsQueue, TopicExchange contentEventsExchange) {
        return BindingBuilder
                .bind(marketplaceContentEventsQueue)
                .to(contentEventsExchange)
                .with("*.*.updated"); // catches flashcard.set.updated and quiz.set.updated
    }

    @Bean
    public Binding marketplaceContentConsumedBinding(Queue marketplaceContentEventsQueue, TopicExchange contentEventsExchange) {
        return BindingBuilder
                .bind(marketplaceContentEventsQueue)
                .to(contentEventsExchange)
                .with("*.*.consumed");
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
        return new ObjectMapper()
                .findAndRegisterModules()
                .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }
}

