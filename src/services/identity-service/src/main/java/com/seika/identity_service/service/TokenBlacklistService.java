package com.seika.identity_service.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenBlacklistService {

    public static final String BLACKLIST_PREFIX = "auth:blacklist::";
    private final StringRedisTemplate stringRedisTemplate;

    public void blacklistToken(String jti, Date expiration) {
        if (jti == null || jti.isBlank()) {
            return;
        }
        long remainingSeconds = 60;
        if (expiration != null) {
            remainingSeconds = (expiration.getTime() - System.currentTimeMillis()) / 1000;
            if (remainingSeconds <= 0) {
                remainingSeconds = 60;
            }
        }
        stringRedisTemplate.opsForValue().set(BLACKLIST_PREFIX + jti, "REVOKED", remainingSeconds, TimeUnit.SECONDS);
        log.info("Blacklisted token JTI={} with TTL={}s", jti, remainingSeconds);
    }

    public boolean isBlacklisted(String jti) {
        if (jti == null || jti.isBlank()) {
            return false;
        }
        try {
            Boolean exists = stringRedisTemplate.hasKey(BLACKLIST_PREFIX + jti);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("Failed to check blacklist for JTI {}: {}", jti, e.getMessage());
            return false;
        }
    }
}
