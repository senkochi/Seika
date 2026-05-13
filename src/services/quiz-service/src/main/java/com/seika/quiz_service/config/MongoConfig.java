package com.seika.quiz_service.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.util.Objects;

@Configuration
public class MongoConfig {

    @Value("${spring.data.mongodb.uri:mongodb://mongo:27017/quiz-service-seika?replicaSet=rs0}")
    private String mongoUri;

    @Value("${spring.data.mongodb.database:quiz-service-seika}")
    private String databaseName;

    @Bean
    public MongoClient mongoClient() {
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(mongoUri))
                .build();

        return MongoClients.create(settings);
    }

    @Bean
    public MongoTemplate mongoTemplate() {
        String resolvedDatabase = Objects.requireNonNullElseGet(
                new ConnectionString(mongoUri).getDatabase(),
                () -> databaseName);

        return new MongoTemplate(mongoClient(), resolvedDatabase);
    }
}
