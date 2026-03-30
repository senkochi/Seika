package com.seika.identity_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Map;

@Service
@Slf4j
public class JwtService {

    private final SecretKey secretKey;
    private final String issuer;
    private final long accessTokenExpirationMinutes;

    public JwtService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.issuer}") String issuer,
            @Value("${jwt.access-token-expiration-minutes}") long accessTokenExpirationMinutes
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 bytes");
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.issuer = issuer;
        this.accessTokenExpirationMinutes = accessTokenExpirationMinutes;
        log.info("JWT service initialized: issuer={}, token-expiration={}min", issuer, accessTokenExpirationMinutes);
    }

    public String generateAccessToken(Authentication authentication) {
        Instant now = Instant.now();
        Instant expiration = now.plus(accessTokenExpirationMinutes, ChronoUnit.MINUTES);

        return Jwts.builder()
                .subject(authentication.getName())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .claims(Map.of("type", "access"))
                .signWith(secretKey)
                .compact();
    }

    public boolean isValidToken(String token) {
        try {
            parseClaims(token);
            log.info("JWT service validated: token={}", token);
            return true;
        } catch (Exception e) {
            log.warn("Token validation failed: {}", e.getClass().getSimpleName());
            return false;
        }
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    private Claims parseClaims(String token) {
        return Jwts.parser() //Khởi tạo một đối tượng parser (trình phân tích) của thư viện JJWT để bắt đầu quá trình đọc và xử lý token
                .verifyWith(secretKey) //So sánh signature của token với secretKey, nếu không khớp sẽ ném exception SignatureException
                .build()
                .parseSignedClaims(token) // Phân tích token đã ký, kiểm tra hợp lệ các thông tin: signature, cấu trúc token, thời gian hết hạn, v.v. Nếu token không hợp lệ sẽ ném exception
                .getPayload();
    }
}
