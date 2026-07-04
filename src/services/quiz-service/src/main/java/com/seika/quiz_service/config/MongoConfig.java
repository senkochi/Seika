package com.seika.quiz_service.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.convert.DefaultDbRefResolver;
import org.springframework.data.mongodb.core.convert.DefaultMongoTypeMapper;
import org.springframework.data.mongodb.core.convert.MappingMongoConverter;
import org.springframework.data.mongodb.core.mapping.MongoMappingContext;

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

        MongoTemplate template = new MongoTemplate(mongoClient(), resolvedDatabase);

        // Make sure polymorphic @TypeAlias annotations are honored when reading
        // polymorphic entities (e.g. BaseQuiz -> MultipleChoiceQuiz, ...).
        MappingMongoConverter converter =
                (MappingMongoConverter) template.getConverter();
        if (converter.getMappingContext() instanceof MongoMappingContext mappingContext) {
            mappingContext.setInitialEntitySet(
                    new java.util.HashSet<>(java.util.Arrays.asList(
                            com.seika.quiz_service.domain.BaseQuiz.class,
                            com.seika.quiz_service.domain.MultipleChoiceQuiz.class,
                            com.seika.quiz_service.domain.MatchingQuiz.class,
                            com.seika.quiz_service.domain.ReorderQuiz.class,
                            com.seika.quiz_service.domain.FillInBlankQuiz.class,
                            com.seika.quiz_service.domain.QuizSet.class)));
            mappingContext.afterPropertiesSet();
        }
        return template;
    }
}
