package com.seika.notification_service.service;

import com.seika.notification_service.dto.NotificationResponse;
import jakarta.annotation.PreDestroy;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class SseService {

    // Map userId -> SseEmitter
    private final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

    // Scheduled executor to send periodic heartbeats so the connection stays
    // alive through API-Gateway and load-balancer idle-connection timeouts.
    private final ScheduledExecutorService heartbeatScheduler =
            Executors.newSingleThreadScheduledExecutor(r -> {
                Thread t = new Thread(r, "sse-heartbeat");
                t.setDaemon(true);
                return t;
            });

    public SseService() {
        // Send a comment ": ping" to every connected client every 25 seconds.
        // Comments are part of the SSE spec and are invisible to listeners but
        // prevent proxies/gateways from closing idle connections.
        heartbeatScheduler.scheduleAtFixedRate(this::sendHeartbeats, 25, 25, TimeUnit.SECONDS);
    }

    public SseEmitter subscribe(String userId) {
        // Timeout set to 0 (infinite). The client reconnects automatically;
        // heartbeats keep proxies from cutting the connection prematurely.
        SseEmitter emitter = new SseEmitter(0L);

        // If there's already an emitter for this user (e.g. duplicate tab),
        // complete the old one before replacing it.
        SseEmitter existing = emitters.put(userId, emitter);
        if (existing != null) {
            try {
                existing.complete();
            } catch (Exception ignored) {
                // Already completed/errored — safe to ignore
            }
        }

        emitter.onCompletion(() -> {
            log.info("SSE completed for user: {}", userId);
            emitters.remove(userId, emitter);
        });

        emitter.onTimeout(() -> {
            log.info("SSE timeout for user: {}", userId);
            emitter.complete();
            emitters.remove(userId, emitter);
        });

        emitter.onError((e) -> {
            log.error("SSE error for user: {}", userId, e);
            emitters.remove(userId, emitter);
        });

        // Send a named CONNECTED event so the client knows the stream is ready.
        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data("Connected successfully to SSE."));
        } catch (IOException e) {
            log.error("Failed to send initial SSE connection event to user: {}", userId, e);
            emitter.completeWithError(e);
            emitters.remove(userId, emitter);
        }

        log.info("SSE subscribed for user: {} (total connections: {})", userId, emitters.size());
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
                emitters.remove(userId, emitter);
            }
        } else {
            log.debug("No active SSE connection for user: {}", userId);
        }
    }

    private void sendHeartbeats() {
        if (emitters.isEmpty()) return;

        log.debug("Sending SSE heartbeat to {} connected client(s)", emitters.size());
        emitters.forEach((userId, emitter) -> {
            try {
                // SSE comment — ignored by EventSource / fetch readers but
                // prevents gateway from treating the connection as idle.
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (IOException e) {
                log.debug("Heartbeat failed for user {}, removing emitter", userId);
                emitter.completeWithError(e);
                emitters.remove(userId, emitter);
            }
        });
    }

    @PreDestroy
    public void shutdown() {
        heartbeatScheduler.shutdownNow();
        emitters.values().forEach(emitter -> {
            try {
                emitter.complete();
            } catch (Exception ignored) {
                // Best-effort cleanup
            }
        });
        emitters.clear();
    }
}
