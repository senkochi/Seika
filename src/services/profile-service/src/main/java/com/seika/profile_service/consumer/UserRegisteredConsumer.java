package com.seika.profile_service.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.seika.profile_service.config.RabbitMQConfig;
import com.seika.profile_service.enity.TeacherProfile;
import com.seika.profile_service.repository.TeacherProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredConsumer {

    private final TeacherProfileRepository teacherProfileRepository;
    private final ObjectMapper objectMapper;

    @RabbitListener(queues = RabbitMQConfig.PROFILE_USER_REGISTERED_QUEUE)
    @Transactional
    public void handleUserRegistered(String rawMessage) {
        try {
            JsonNode node = objectMapper.readTree(rawMessage);
            String userId = node.path("userId").asText();
            JsonNode rolesNode = node.path("payload").path("roles");
            
            boolean isTeacher = false;
            if (rolesNode.isArray()) {
                for (JsonNode role : rolesNode) {
                    if ("TEACHER".equalsIgnoreCase(role.asText())) {
                        isTeacher = true;
                        break;
                    }
                }
            }

            if (isTeacher && userId != null && !userId.isBlank()) {
                if (!teacherProfileRepository.existsByUserId(userId)) {
                    TeacherProfile newProfile = TeacherProfile.builder()
                            .userId(userId)
                            .totalQuizCreated(0)
                            .totalFlashcardsCreated(0)
                            .totalStudentsReached(0)
                            .build();
                    teacherProfileRepository.save(newProfile);
                    log.info("Created TeacherProfile for newly registered teacher userId={}", userId);
                }
            }
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize user.registered message. payload={}", rawMessage, e);
        } catch (Exception e) {
            log.error("Failed to process user.registered message. payload={}", rawMessage, e);
        }
    }
}
