package com.seika.identity_service;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seika.identity_service.dto.auth.AuthResponse;
import com.seika.identity_service.dto.auth.IntrospectResponse;
import com.seika.identity_service.dto.auth.UserInfoResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.List;
import java.util.Set;

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
                .allowIfBaseType("java.lang.")
                .build();

        objectMapper.activateDefaultTyping(ptv, ObjectMapper.DefaultTyping.EVERYTHING, JsonTypeInfo.As.PROPERTY);

        serializer = new GenericJackson2JsonRedisSerializer(objectMapper);
    }

    @Test
    void testAuthResponseSerializationRoundTrip() {
        AuthResponse original = new AuthResponse("mock.access.token", "mock.refresh.token", "Bearer", "student_seika", Set.of("STUDENT"));

        byte[] serializedBytes = serializer.serialize(original);
        assertNotNull(serializedBytes);
        assertTrue(serializedBytes.length > 0);

        Object deserialized = serializer.deserialize(serializedBytes);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof AuthResponse);

        AuthResponse roundTrip = (AuthResponse) deserialized;
        assertEquals(original.getUsername(), roundTrip.getUsername());
        assertEquals(original.getAccessToken(), roundTrip.getAccessToken());
        assertEquals(original.getRefreshToken(), roundTrip.getRefreshToken());
        assertEquals(original.getTokenType(), roundTrip.getTokenType());
    }

    @Test
    void testUserInfoResponseSerializationRoundTrip() {
        UserInfoResponse original = new UserInfoResponse("user-123", "student_seika", Set.of("STUDENT"));

        byte[] serializedBytes = serializer.serialize(original);
        assertNotNull(serializedBytes);

        Object deserialized = serializer.deserialize(serializedBytes);
        assertTrue(deserialized instanceof UserInfoResponse);

        UserInfoResponse roundTrip = (UserInfoResponse) deserialized;
        assertEquals(original.getId(), roundTrip.getId());
        assertEquals(original.getUsername(), roundTrip.getUsername());
    }

    @Test
    void testIntrospectResponseSerializationRoundTrip() {
        IntrospectResponse original = IntrospectResponse.builder()
                .valid(true)
                .username("student_seika")
                .roles(List.of("STUDENT"))
                .userId("user-123")
                .build();

        byte[] serializedBytes = serializer.serialize(original);
        assertNotNull(serializedBytes);

        Object deserialized = serializer.deserialize(serializedBytes);
        assertTrue(deserialized instanceof IntrospectResponse);

        IntrospectResponse roundTrip = (IntrospectResponse) deserialized;
        assertTrue(roundTrip.isValid());
        assertEquals("student_seika", roundTrip.getUsername());
        assertEquals("user-123", roundTrip.getUserId());
    }
}
