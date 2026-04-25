package com.seika.identity_service.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import com.seika.identity_service.security.CustomUserDetails;

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
        String jti = UUID.randomUUID().toString(); // JTI: Viết tắt của Token ID để hỗ trợ revoke(hủy bỏ hiệu lực) token
        
        // Extract roles từ authentication
        List<String> roles = authentication.getAuthorities().stream() // Lấy danh sách các quyền (GrantedAuthority) từ đối tượng Authentication, sau đó chuyển đổi chúng thành một danh sách các chuỗi (String) đại diện cho tên của các quyền đó.
                .map(GrantedAuthority::getAuthority) // Lấy tên quyền từ đối tượng GrantedAuthority bằng cách gọi phương thức getAuthority(), sau đó sử dụng map để chuyển đổi mỗi GrantedAuthority thành một chuỗi tên quyền.
                .map(auth -> auth.startsWith("ROLE_") ? auth.substring(5) : auth) // Loại bỏ tiền tố "ROLE_" nếu có, để chỉ giữ lại tên quyền thuần túy. Ví dụ: "ROLE_ADMIN" sẽ trở thành "ADMIN".
                .toList();

        // Extract userId từ authentication        
        String userId = "";
        if (authentication.getPrincipal() instanceof CustomUserDetails userDetails) {
            userId = userDetails.getUser().getId();
        }

        return Jwts.builder()
                .subject(authentication.getName())
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .id(jti) // JWT ID
                .claim("type", "access")
                .claim("roles", roles) // Thêm roles vào claims
                .claim("userId", userId) // Thêm userId vào claims
                .claim("tokenVersion", 1) // Hỗ trợ revoke khi đổi quyền
                .signWith(secretKey)
                .compact();
    }

    public boolean isValidToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            log.warn("Token validation failed: {}", e.getClass().getSimpleName());
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
