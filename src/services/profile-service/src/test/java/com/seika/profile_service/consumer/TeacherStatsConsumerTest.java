package com.seika.profile_service.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.seika.profile_service.enity.TeacherProfile;
import com.seika.profile_service.event.TeacherTierUpdatedEvent;
import com.seika.profile_service.repository.GameProfileRepository;
import com.seika.profile_service.repository.TeacherProfileRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TeacherStatsConsumerTest {

    @Test
    void mirrorsTeacherTierUpdatedEventIntoTeacherProfile() throws Exception {
        TeacherProfileRepository teacherProfileRepository = mock(TeacherProfileRepository.class);
        GameProfileRepository gameProfileRepository = mock(GameProfileRepository.class);
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        TeacherStatsConsumer consumer = new TeacherStatsConsumer(
                teacherProfileRepository,
                gameProfileRepository,
                objectMapper);

        TeacherProfile profile = TeacherProfile.builder()
                .userId("teacher-1")
                .teacherTier("BRONZE")
                .teacherAverageRating(new BigDecimal("3.20"))
                .teacherValidReviewCount(8)
                .teacherTierFeePercent(new BigDecimal("15.00"))
                .build();
        when(teacherProfileRepository.findByUserId("teacher-1")).thenReturn(Optional.of(profile));
        when(teacherProfileRepository.save(any(TeacherProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TeacherTierUpdatedEvent event = TeacherTierUpdatedEvent.builder()
                .eventId("evt-1")
                .eventType("teacher.tier.updated")
                .teacherId("teacher-1")
                .tier("GOLD")
                .averageRating(new BigDecimal("4.25"))
                .validReviewCount(120)
                .tierFeePercent(new BigDecimal("5.00"))
                .occurredAt(Instant.parse("2026-07-16T08:00:00Z"))
                .build();

        consumer.handleTeacherTierUpdated(objectMapper.writeValueAsString(event));

        ArgumentCaptor<TeacherProfile> captor = ArgumentCaptor.forClass(TeacherProfile.class);
        verify(teacherProfileRepository).save(captor.capture());
        TeacherProfile saved = captor.getValue();
        assertThat(saved.getTeacherTier()).isEqualTo("GOLD");
        assertThat(saved.getTeacherAverageRating()).isEqualByComparingTo("4.25");
        assertThat(saved.getTeacherValidReviewCount()).isEqualTo(120);
        assertThat(saved.getTeacherTierFeePercent()).isEqualByComparingTo("5.00");
        assertThat(saved.getTeacherTierUpdatedAt()).isEqualTo(Instant.parse("2026-07-16T08:00:00Z"));
        assertThat(saved.getLastProcessedEventId()).isEqualTo("evt-1");
    }

    @Test
    void teacherTierUpdatedSkipsStaleEventId() throws Exception {
        TeacherProfileRepository teacherProfileRepository = mock(TeacherProfileRepository.class);
        GameProfileRepository gameProfileRepository = mock(GameProfileRepository.class);
        ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        TeacherStatsConsumer consumer = new TeacherStatsConsumer(
                teacherProfileRepository,
                gameProfileRepository,
                objectMapper);

        TeacherProfile profile = TeacherProfile.builder()
                .userId("teacher-1")
                .teacherTier("ELITE")
                .teacherAverageRating(new BigDecimal("4.80"))
                .teacherValidReviewCount(200)
                .teacherTierFeePercent(new BigDecimal("2.00"))
                .lastProcessedEventId("EVT-99")
                .build();
        when(teacherProfileRepository.findByUserId("teacher-1")).thenReturn(Optional.of(profile));

        TeacherTierUpdatedEvent staleEvent = TeacherTierUpdatedEvent.builder()
                .eventId("EVT-50")
                .eventType("teacher.tier.updated")
                .teacherId("teacher-1")
                .tier("GOLD")
                .averageRating(new BigDecimal("4.10"))
                .validReviewCount(150)
                .tierFeePercent(new BigDecimal("5.00"))
                .occurredAt(Instant.parse("2026-07-15T08:00:00Z"))
                .build();

        consumer.handleTeacherTierUpdated(objectMapper.writeValueAsString(staleEvent));

        verify(teacherProfileRepository, never()).save(any(TeacherProfile.class));
        assertThat(profile.getTeacherTier()).isEqualTo("ELITE");
        assertThat(profile.getLastProcessedEventId()).isEqualTo("EVT-99");
    }
}
