package com.seika.notification_service.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String USER_REGISTERED_EXCHANGE = "identity.events";
    public static final String USER_REGISTERED_QUEUE = "notification.user-events";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";

    public static final String MARKETPLACE_EXCHANGE = "marketplace.events";
    public static final String MARKETPLACE_QUEUE = "notification.marketplace-events";
    public static final String CONTENT_PURCHASED_ROUTING_KEY = "content.purchased";

    @Bean
    public TopicExchange userRegisteredExchange() {
        return new TopicExchange(USER_REGISTERED_EXCHANGE);
    }

    @Bean
    public Queue userRegisteredQueue() {
        return new Queue(USER_REGISTERED_QUEUE, true);
    }

    @Bean
    public Binding userRegisteredBinding(Queue userRegisteredQueue, TopicExchange userRegisteredExchange) {
      return BindingBuilder
          .bind(userRegisteredQueue)
          .to(userRegisteredExchange)
          .with(USER_REGISTERED_ROUTING_KEY);
    }

    @Bean
    public TopicExchange marketplaceExchange() {
        return new TopicExchange(MARKETPLACE_EXCHANGE);
    }

    @Bean
    public Queue marketplaceQueue() {
        return new Queue(MARKETPLACE_QUEUE, true);
    }

    @Bean
    public Binding marketplaceBinding(Queue marketplaceQueue, TopicExchange marketplaceExchange) {
      return BindingBuilder
          .bind(marketplaceQueue)
          .to(marketplaceExchange)
          .with(CONTENT_PURCHASED_ROUTING_KEY);
    }

    public static final String LEARNING_EVENTS_EXCHANGE = "learning.events";
    public static final String NOTIFICATION_REWARD_QUEUE = "notification.reward-events";
    public static final String REWARD_GRANTED_ROUTING_KEY = "reward.granted";

    @Bean
    public TopicExchange learningEventsExchange() {
        return new TopicExchange(LEARNING_EVENTS_EXCHANGE);
    }

    @Bean
    public Queue notificationRewardQueue() {
        return new Queue(NOTIFICATION_REWARD_QUEUE, true);
    }

    @Bean
    public Binding notificationRewardBinding(Queue notificationRewardQueue, TopicExchange learningEventsExchange) {
        return BindingBuilder
            .bind(notificationRewardQueue)
            .to(learningEventsExchange)
            .with(REWARD_GRANTED_ROUTING_KEY);
    }
    
    // Vì mặc định RabbitMQ sử dụng dữ liệu nhị phân, nên chúng ta cần một MessageConverter để chuyển đổi giữa JSON và đối tượng Java
    @Bean
    public MessageConverter jsonMessageConverter() {
      return new JacksonJsonMessageConverter();
    }
}