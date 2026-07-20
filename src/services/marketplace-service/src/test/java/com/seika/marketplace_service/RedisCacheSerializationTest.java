package com.seika.marketplace_service;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seika.marketplace_service.dto.ProductResponse;
import com.seika.marketplace_service.enums.ProductStatus;
import com.seika.marketplace_service.enums.ProductType;
import com.seika.marketplace_service.enums.TeacherTier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.math.BigDecimal;
import java.time.Instant;

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

        objectMapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.NON_FINAL, JsonTypeInfo.As.PROPERTY);

        serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Test
    void testProductResponseSerializationRoundTrip() {
        ProductResponse original = ProductResponse.builder()
                .id("prod-123")
                .name("Complete Java Course")
                .description("Master Java & Spring Boot")
                .price(new BigDecimal("99.99"))
                .type(ProductType.FLASHCARD)
                .referenceId("ref-456")
                .active(true)
                .sellerUserId("seller-789")
                .status(ProductStatus.PUBLISHED)
                .rejectionReason(null)
                .teacherDisplayName("Teacher Seika")
                .teacherTier(TeacherTier.GOLD)
                .teacherAverageRating(new BigDecimal("4.80"))
                .teacherValidReviewCount(150L)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        byte[] serializedBytes = serializer.serialize(original);
        assertNotNull(serializedBytes);
        assertTrue(serializedBytes.length > 0);

        Object deserialized = serializer.deserialize(serializedBytes);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof ProductResponse);

        ProductResponse roundTrip = (ProductResponse) deserialized;
        assertEquals(original.getId(), roundTrip.getId());
        assertEquals(original.getName(), roundTrip.getName());
        assertEquals(original.getPrice(), roundTrip.getPrice());
        assertEquals(original.getType(), roundTrip.getType());
        assertEquals(original.getSellerUserId(), roundTrip.getSellerUserId());
        assertEquals(original.getStatus(), roundTrip.getStatus());
        assertEquals(original.getTeacherTier(), roundTrip.getTeacherTier());
    }
}
