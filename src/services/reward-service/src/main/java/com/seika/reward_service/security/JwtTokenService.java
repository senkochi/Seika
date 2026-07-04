package com.seika.reward_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
@Slf4j
public class JwtTokenService {

    private final SecretKey secretKey;
    private final String issuer;

    public JwtTokenService(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.issuer}") String issuer
    ) {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 32 bytes");
        }
        this.secretKey = Keys.hmacShaKeyFor(keyBytes);
        this.issuer = issuer;
        
        // Log initialization để check xem config được load đúng không
        log.error("[PROFILE-SERVICE-JWT] JwtTokenService initialized with issuer: {}", issuer);
    }

    public boolean isValidToken(String token) {
        try {
            Claims claims = parseClaims(token);
            boolean issuerMatch = issuer.equals(claims.getIssuer());
            log.info("[PROFILE-SERVICE] Token validation - issuer={}, expected={}, match={}, userId={}, username={}", 
                    claims.getIssuer(), 
                    issuer, 
                    issuerMatch,
                    claims.get("userId"),
                    claims.getSubject());
            if (!issuerMatch) {
                log.error("[PROFILE-SERVICE] Issuer mismatch! Token issuer: {} != Expected: {}", 
                        claims.getIssuer(), issuer);
                return false;
            }
            return true;
        } catch (Exception e) {
            log.error("[PROFILE-SERVICE] Token validation FAILED - Error: {} - Message: {}", 
                    e.getClass().getSimpleName(), 
                    e.getMessage());
            return false;
        }
    }

    public String extractUserId(String token) {
        return parseClaims(token).get("userId", String.class);
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    @SuppressWarnings("unchecked")
    public List<String> extractRoles(String token) {
        return parseClaims(token).get("roles", List.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
