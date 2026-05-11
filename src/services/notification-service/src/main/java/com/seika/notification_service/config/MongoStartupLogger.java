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
        String database = extractDatabaseFromUri(uri);

        log.info("[NOTIFICATION-SERVICE] MongoDB URI: {}", uri);
  
        log.info("[NOTIFICATION-SERVICE] MongoDB database: {}", database);

        if ("test".equalsIgnoreCase(database) || database == null || database.isEmpty()) {
            log.error("[NOTIFICATION-SERVICE] MongoDB database is not properly configured. Using: {}", database);
            throw new IllegalStateException("MongoDB database not found in URI. Check configuration source.");
        }
    }

    private String extractDatabaseFromUri(String uri) {
        if (uri == null || uri.isEmpty()) {
            return null;
        }
        
        // For mongodb+srv:// or mongodb:// URIs, extract database name from path
        // Format: mongodb://host/dbname or mongodb+srv://host/dbname?options
        try {
            String[] parts = uri.split("/");
            if (parts.length >= 4) {
                // Get the part after the host, before query params
                String dbPart = parts[3];
                if (dbPart.contains("?")) {
                    return dbPart.split("\\?")[0];
                }
                return dbPart;
            }
        } catch (Exception e) {
            log.warn("Failed to parse database name from URI: {}", uri, e);
        }
        
        return null;
    }
}
