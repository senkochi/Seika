package com.seika.profile_service;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seika.profile_service.dto.user_profile.UserProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.time.LocalDate;

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
    void testUserProfileResponseSerializationRoundTrip() {
        UserProfileResponse original = UserProfileResponse.builder()
                .id("profile-505")
                .userId("user-606")
                .fullName("Nguyen Cuong")
                .dateOfBirth(LocalDate.of(2000, 1, 1))
                .gender("MALE")
                .profilePictureUrl("http://avatar.url/pic.jpg")
                .exp(1500L)
                .level(10)
                .currentStreak(5)
                .longestStreak(12)
                .quizzesCompleted(25)
                .build();

        byte[] serializedBytes = serializer.serialize(original);
        assertNotNull(serializedBytes);
        assertTrue(serializedBytes.length > 0);

        Object deserialized = serializer.deserialize(serializedBytes);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof UserProfileResponse);

        UserProfileResponse roundTrip = (UserProfileResponse) deserialized;
        assertEquals(original.getId(), roundTrip.getId());
        assertEquals(original.getUserId(), roundTrip.getUserId());
        assertEquals(original.getFullName(), roundTrip.getFullName());
        assertEquals(original.getDateOfBirth(), roundTrip.getDateOfBirth());
        assertEquals(original.getExp(), roundTrip.getExp());
        assertEquals(original.getLevel(), roundTrip.getLevel());
    }
}
