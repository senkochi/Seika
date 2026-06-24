package com.seika.notification_service.service;

import com.seika.notification_service.dto.NotificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class SseService {

    // Map userId -> SseEmitter
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userId) {
        // timeout 30 minutes, or you can set to 0 for infinite
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L);
        
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> {
            log.info("SSE completed for user: {}", userId);
            emitters.remove(userId);
        });

        emitter.onTimeout(() -> {
            log.info("SSE timeout for user: {}", userId);
            emitter.complete();
            emitters.remove(userId);
        });

        emitter.onError((e) -> {
            log.error("SSE error for user: {}", userId, e);
            emitter.completeWithError(e);
            emitters.remove(userId);
        });

        // Send a dummy event to establish the connection
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected successfully to SSE."));
        } catch (IOException e) {
            log.error("Failed to send initial SSE connection event to user: {}", userId, e);
            emitter.completeWithError(e);
            emitters.remove(userId);
        }

        return emitter;
    }

    public void sendNotification(String userId, NotificationResponse notification) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event()
                        .name("NOTIFICATION")
                        .data(notification));
                log.info("Sent SSE notification to user: {}", userId);
            } catch (IOException e) {
                log.error("Error sending SSE to user: {}", userId, e);
                emitter.completeWithError(e);
                emitters.remove(userId);
            }
        } else {
            log.debug("No active SSE connection for user: {}", userId);
        }
    }
}
