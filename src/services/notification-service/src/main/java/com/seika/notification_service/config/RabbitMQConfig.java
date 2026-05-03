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
    
    // Vì mặc định RabbitMQ sử dụng dữ liệu nhị phân, nên chúng ta cần một MessageConverter để chuyển đổi giữa JSON và đối tượng Java
    @Bean
    public MessageConverter jsonMessageConverter() {
      return new JacksonJsonMessageConverter();
    }
}