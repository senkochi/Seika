package com.seika.flashcard_service;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.databind.jsontype.PolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seika.flashcard_service.domain.CardSet;
import com.seika.flashcard_service.dto.CardSetDTO;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

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
    void testCardSetDTOSerializationRoundTrip() {
        List<CardSet.Card> cards = new ArrayList<>();
        cards.add(new CardSet.Card("Hello", "Xin chào"));

        CardSetDTO original = CardSetDTO.builder()
                .id("set-101")
                .title("English Vocabulary")
                .description("Basic words")
                .authorId("author-202")
                .price(new BigDecimal("19.99"))
                .totalCards(1)
                .cards(cards)
                .build();

        byte[] serializedBytes = serializer.serialize(original);
        assertNotNull(serializedBytes);
        assertTrue(serializedBytes.length > 0);

        Object deserialized = serializer.deserialize(serializedBytes);
        assertNotNull(deserialized);
        assertTrue(deserialized instanceof CardSetDTO);

        CardSetDTO roundTrip = (CardSetDTO) deserialized;
        assertEquals(original.getId(), roundTrip.getId());
        assertEquals(original.getTitle(), roundTrip.getTitle());
        assertEquals(original.getAuthorId(), roundTrip.getAuthorId());
        assertEquals(original.getPrice(), roundTrip.getPrice());
        assertNotNull(roundTrip.getCards());
        assertEquals(1, roundTrip.getCards().size());
        assertEquals("Hello", roundTrip.getCards().get(0).getFrontSide());
    }
}
