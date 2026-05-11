package com.seika.notification_service.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class MongoStartupLogger {

    private final MongoTemplate mongoTemplate;
    private final Environment environment;

    @EventListener(ApplicationReadyEvent.class)
    public void logMongoConnection() {
        String uri = environment.getProperty("spring.data.mongodb.uri");
        String database = mongoTemplate.getDb().getName();

        log.info("[NOTIFICATION-SERVICE] MongoDB URI: {}", uri);
  
        log.info("[NOTIFICATION-SERVICE] MongoDB database: {}", database);

        if ("test".equalsIgnoreCase(database)) {
            log.error("[NOTIFICATION-SERVICE] MongoDB is using default 'test' database. Failing fast.");
            throw new IllegalStateException("MongoDB database resolved to 'test'. Check configuration source.");
        }
    }
}
