package com.seika.identity_service.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.identity_service.entity.User;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class UserEventPublisherTest {

    @Test
    void publicIdentitySnapshotContainsOnlyPublicIdentityFields() throws Exception {
        RabbitTemplate rabbitTemplate = mock(RabbitTemplate.class);
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();
        UserEventPublisher publisher = new UserEventPublisher(rabbitTemplate, objectMapper);
        ReflectionTestUtils.setField(publisher, "identityEventsExchange", "identity.events");
        ReflectionTestUtils.setField(
                publisher,
                "publicIdentitySnapshotRoutingKey",
                "user.public-identity.snapshot");

        publisher.publishPublicIdentitySnapshot(
                User.builder().id("teacher-1").username("lan.nguyen").build());

        ArgumentCaptor<String> payloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(rabbitTemplate).convertAndSend(
                org.mockito.ArgumentMatchers.eq("identity.events"),
                org.mockito.ArgumentMatchers.eq("user.public-identity.snapshot"),
                payloadCaptor.capture());

        JsonNode payload = objectMapper.readTree(payloadCaptor.getValue());
        assertThat(payload.path("eventType").asText())
                .isEqualTo("user.public-identity.snapshot");
        assertThat(payload.path("userId").asText()).isEqualTo("teacher-1");
        assertThat(payload.path("payload").path("username").asText())
                .isEqualTo("lan.nguyen");
        assertThat(payload.path("payload").size()).isEqualTo(1);
    }
}
