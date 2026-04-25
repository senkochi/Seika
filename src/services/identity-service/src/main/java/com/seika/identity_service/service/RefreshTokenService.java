package com.seika.identity_service.service;

import com.seika.identity_service.entity.RefreshToken;
import com.seika.identity_service.entity.User;
import com.seika.identity_service.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token-expiration-days}")
    private long refreshTokenExpirationDays;

    @Transactional
    public String createTokenForUser(User user) {
        String tokenValue = Base64.getUrlEncoder().withoutPadding().encodeToString(UUID.randomUUID().toString().getBytes());
        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenValue)
                .expiresAt(Instant.now().plus(refreshTokenExpirationDays, ChronoUnit.DAYS))
                .revoked(false)
                .user(user)
                .build();

        return refreshTokenRepository.save(refreshToken).getToken();
    }

    public boolean isExpired(RefreshToken refreshToken) {
        return refreshToken.getExpiresAt().isBefore(Instant.now());
    }

    @Transactional
    public void revokeToken(RefreshToken refreshToken) {
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }
}