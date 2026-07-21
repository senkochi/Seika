package com.seika.identity_service;

import com.seika.identity_service.service.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

import java.util.Date;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TokenBlacklistServiceTest {

    @Mock
    private StringRedisTemplate stringRedisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    private TokenBlacklistService tokenBlacklistService;

    @BeforeEach
    void setUp() {
        tokenBlacklistService = new TokenBlacklistService(stringRedisTemplate);
    }

    @Test
    void testBlacklistTokenWithValidExpiration() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOperations);

        Date future = new Date(System.currentTimeMillis() + 600_000); // 10 minutes ahead
        tokenBlacklistService.blacklistToken("jti-123", future);

        verify(valueOperations, times(1)).set(eq("auth:blacklist::jti-123"), eq("REVOKED"), longThat(ttl -> ttl > 0 && ttl <= 600), eq(TimeUnit.SECONDS));
    }

    @Test
    void testIsBlacklistedWhenExists() {
        when(stringRedisTemplate.hasKey("auth:blacklist::jti-456")).thenReturn(true);

        assertTrue(tokenBlacklistService.isBlacklisted("jti-456"));
    }

    @Test
    void testIsBlacklistedWhenNotExists() {
        when(stringRedisTemplate.hasKey("auth:blacklist::jti-789")).thenReturn(false);

        assertFalse(tokenBlacklistService.isBlacklisted("jti-789"));
    }
}
