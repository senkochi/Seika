package com.cardy.walletService.config;

import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.MessageConverter;

import java.util.Map;

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

    public static final String LEARNING_EVENTS_EXCHANGE = "learning.events";
    public static final String WALLET_REWARD_QUEUE = "wallet.reward-events";
    public static final String REWARD_GRANTED_ROUTING_KEY = "reward.granted";

    @Bean
    public TopicExchange learningEventsExchange() {
        return new TopicExchange(LEARNING_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public Queue walletRewardQueue() {
        return new Queue(WALLET_REWARD_QUEUE, true);
    }

    @Bean
    public Binding walletRewardBinding(Queue walletRewardQueue, TopicExchange learningEventsExchange) {
        return BindingBuilder.bind(walletRewardQueue).to(learningEventsExchange).with(REWARD_GRANTED_ROUTING_KEY);
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
    public Binding publicIdentitySnapshotBinding(
            Queue userRegisteredQueue,
            TopicExchange identityEventsExchange,
            @Value("${messaging.events.public-identity-snapshot-routing-key:user.public-identity.snapshot}")
                    String routingKey) {
        return BindingBuilder.bind(userRegisteredQueue)
                .to(identityEventsExchange)
                .with(routingKey);
    }

    @Bean
    public MessageConverter jsonMessageConverter() { return new JacksonJsonMessageConverter(); }

    public static final String WALLET_COMMANDS_EXCHANGE = "wallet.commands";
    public static final String WALLET_COMMANDS_QUEUE = "wallet.commands.queue";
    public static final String WALLET_DEBIT_ROUTING_KEY = "wallet.debit.requested";
    public static final String WALLET_CREDIT_ROUTING_KEY = "wallet.credit.requested";
    public static final String WALLET_REFUND_ROUTING_KEY = "wallet.refund.requested";

    public static final String MARKETPLACE_EVENTS_EXCHANGE = "marketplace.events";
    public static final String MARKETPLACE_EVENTS_QUEUE = "wallet.marketplace-events";
    public static final String CONTENT_PURCHASED_ROUTING_KEY = "content.purchased";

    public static final String WALLET_EVENTS_EXCHANGE = "wallet.events";

    /**
     * Dead-letter exchange + queue. Used by the wallet outbox processor to
     * park events that exceed {@code wallet.outbox.processor.max-attempts}.
     * Other consumers (e.g. {@code CollusionEventConsumer}) should also bind
     * their queues' {@code x-dead-letter-exchange} to this exchange so that
     * poison messages that fail processing end up here instead of being
     * re-delivered forever.
     */
    public static final String WALLET_EVENTS_DLX = "wallet.events.dlx";
    public static final String WALLET_EVENTS_DLQ = "wallet.events.dlq";

    @Bean
    public TopicExchange walletCommandsExchange() {
        return new TopicExchange(WALLET_COMMANDS_EXCHANGE);
    }

    @Bean
    public Queue walletCommandsQueue() {
        return new Queue(WALLET_COMMANDS_QUEUE, true);
    }

    @Bean
    public Binding walletCommandsBinding(Queue walletCommandsQueue, TopicExchange walletCommandsExchange) {
        return BindingBuilder.bind(walletCommandsQueue).to(walletCommandsExchange).with(WALLET_DEBIT_ROUTING_KEY);
    }

    @Bean
    public Binding walletCreditCommandsBinding(Queue walletCommandsQueue, TopicExchange walletCommandsExchange) {
        return BindingBuilder.bind(walletCommandsQueue).to(walletCommandsExchange).with(WALLET_CREDIT_ROUTING_KEY);
    }

    @Bean
    public Binding walletRefundCommandsBinding(Queue walletCommandsQueue, TopicExchange walletCommandsExchange) {
        return BindingBuilder.bind(walletCommandsQueue).to(walletCommandsExchange).with(WALLET_REFUND_ROUTING_KEY);
    }

    @Bean
    public TopicExchange marketplaceEventsExchange() {
        return new TopicExchange(MARKETPLACE_EVENTS_EXCHANGE, true, false);
    }

    @Bean
    public Queue marketplaceEventsQueue() {
        return new Queue(MARKETPLACE_EVENTS_QUEUE, true);
    }

    @Bean
    public Binding marketplaceEventsBinding(Queue marketplaceEventsQueue, TopicExchange marketplaceEventsExchange) {
        return BindingBuilder.bind(marketplaceEventsQueue).to(marketplaceEventsExchange).with(CONTENT_PURCHASED_ROUTING_KEY);
    }

    public static final String COLLUSION_FLAGS_QUEUE = "wallet.collusion.flags.queue";
    public static final String COLLUSION_FLAGGED_ROUTING_KEY = "collusion.flagged";

    @Bean
    public Queue collusionFlagsQueue() {
        // route consumer-side poison messages to the wallet DLX so they don't
        // get re-delivered forever. Consumer-level handling is owned by
        // CollusionEventConsumer (Task 6).
        return new Queue(COLLUSION_FLAGS_QUEUE, true, false, false,
                Map.of("x-dead-letter-exchange", WALLET_EVENTS_DLX));
    }

    @Bean
    public Binding collusionFlagsBinding(Queue collusionFlagsQueue, TopicExchange marketplaceEventsExchange) {
        return BindingBuilder.bind(collusionFlagsQueue).to(marketplaceEventsExchange).with(COLLUSION_FLAGGED_ROUTING_KEY);
    }

    // --- DLX / DLQ ---

    @Bean
    public DirectExchange walletEventsDlx() {
        return new DirectExchange(WALLET_EVENTS_DLX, true, false);
    }

    @Bean
    public Queue walletEventsDlq() {
        return new Queue(WALLET_EVENTS_DLQ, true);
    }

    @Bean
    public Binding walletEventsDlqBinding(Queue walletEventsDlq, DirectExchange walletEventsDlx) {
        return BindingBuilder.bind(walletEventsDlq).to(walletEventsDlx).with("");
    }
}
