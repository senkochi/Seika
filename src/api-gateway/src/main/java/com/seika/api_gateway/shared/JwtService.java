package com.seika.api_gateway.shared;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
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

    public boolean isValidToken(String token) {
        try {
            Claims claims = parseClaims(token);
            log.info("[GATEWAY] Token validation SUCCESS - issuer: {}, userId: {}, username: {}", 
                    claims.getIssuer(), 
                    claims.get("userId"), 
                    claims.getSubject());
            return true;
        } catch (Exception e) {
            log.error("[GATEWAY] Token validation FAILED - Error: {} - Message: {}", 
                    e.getClass().getSimpleName(), 
                    e.getMessage());
            return false;
        }
    }

    // Trả về String username khi input token
    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    // Trả về List<String> roles khi input token
    public List<String> extractRoles(String token) {
        Claims claims = parseClaims(token);
        return claims.get("roles", List.class);
    }

    // Trả về String userId khi input token
    public String extractUserId(String token) {
        Claims claims = parseClaims(token);
        return claims.get("userId", String.class);
    }

    // Trả về String jti khi input token
    public String extractJti(String token) {
        return parseClaims(token).getId();
    }

    // Trả về Integer tokenVersion khi input token, nếu không có thì trả về 1
    public Integer extractTokenVersion(String token) {
        Claims claims = parseClaims(token);
        Object version = claims.get("tokenVersion");
        return version instanceof Integer ? (Integer) version
                : (version instanceof Number ? ((Number) version).intValue() : 1);
    }

    // Phân tích và xác thực token JWT. Nếu token hợp lệ, trả về các claims chứa trong token. 
    private Claims parseClaims(String token) {
        return Jwts.parser() //Khởi tạo một đối tượng parser (trình phân tích) của thư viện JJWT để bắt đầu quá trình đọc và xử lý token
                .verifyWith(secretKey) //So sánh signature của token với secretKey, nếu không khớp sẽ ném exception SignatureException
                .build()
                .parseSignedClaims(token) // Phân tích token đã ký, kiểm tra hợp lệ các thông tin: signature, cấu trúc token, thời gian hết hạn, v.v. Nếu token không hợp lệ sẽ ném exception
                .getPayload();
    }
}
