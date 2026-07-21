package com.seika.quiz_service;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seika.quiz_service.dto.quizset.QuizSetResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

public class RedisCacheSerializationTest {

    private GenericJackson2JsonRedisSerializer serializer;

    @BeforeEach
    void setUp() {
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

        PolymorphicTypeValidator ptv = BasicPolymorphicTypeValidator.builder()
                .allowIfBaseType("com.seika.")
                .allowIfBaseType("java.util.")
                .allowIfBaseType("java.time.")
                .allowIfBaseType("java.math.")
                .allowIfBaseType("java.lang.")
                .build();

        objectMapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.EVERYTHING, JsonTypeInfo.As.PROPERTY);

        serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Test
    void testQuizSetResponseSerializationRoundTrip() {
        QuizSetResponse original = QuizSetResponse.builder()
                .id("quizset-303")
                .title("Spring Boot Quiz")
                .description("Test your knowledge")
                .price(new BigDecimal("29.99"))
                .quizzes(new ArrayList<>())
                .createdBy("teacher-404")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        byte[] serializedBytes = serializer.serialize(original);
        assertNotNull(serializedBytes);
        assertTrue(serializedBytes.length > 0);

        Object deserialized = serializer.deserialize(serializedBytes);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof QuizSetResponse);

        QuizSetResponse roundTrip = (QuizSetResponse) deserialized;
        assertEquals(original.getId(), roundTrip.getId());
        assertEquals(original.getTitle(), roundTrip.getTitle());
        assertEquals(original.getPrice(), roundTrip.getPrice());
        assertEquals(original.getCreatedBy(), roundTrip.getCreatedBy());
    }
}
