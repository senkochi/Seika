package com.seika.api_gateway.filter;

import com.seika.api_gateway.config.ApiConfig;
import com.seika.api_gateway.shared.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@Slf4j
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private static final String BEARER_PREFIX = "Bearer ";
    private final JwtService jwtService;
    private final ApiConfig apiConfig;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();
        String method = exchange.getRequest().getMethod().toString();
        
        log.info("[GATEWAY-AUTH] Processing {} {} request", method, path);

        // Lấy path của request để kiểm tra có phải public không?
        if (isPublicPath(path)) {
            log.info("[GATEWAY-AUTH] ✓ Public path, skipping authentication: {}", path);
            return chain.filter(exchange);
        }

        log.info("[GATEWAY-AUTH] ✗ Protected path, requiring authentication: {}", path);
        
        // Lấy header Authorization từ request 
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // Kiểm tra rỗng và lấy token từ header
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            log.warn("[GATEWAY-AUTH] ✗ Missing or invalid Authorization header for {}", path);
            return unauthenticated(exchange.getResponse(), "Missing or invalid Authorization header");
        }
        
        String token = authHeader.substring(BEARER_PREFIX.length());

        try {
            // Validate token locally using JwtService (không cần gọi identity service)
            if (!jwtService.isValidToken(token)) {
                log.warn("[GATEWAY-AUTH] ✗ Invalid JWT token for {}", path);
                return unauthenticated(exchange.getResponse(), "Invalid JWT token");
            }

            // Extract thông tin từ token
            String username = jwtService.extractUsername(token);
            String userId = jwtService.extractUserId(token);
            List<String> roles = jwtService.extractRoles(token);

            log.info("[GATEWAY-AUTH] ✓ Token validated for {} - user: {}, userId: {}, roles: {}", 
                    path, username, userId, roles);

            // Thêm thông tin vào request headers để các service phía sau có thể sử dụng
            ServerWebExchange mutatedExchange = exchange.mutate()
                    .request(exchange.getRequest().mutate()
                            .header("X-User-Name", username)
                            .header("X-User-Id", userId)
                            .header("X-User-Roles", String.join(",", roles != null ? roles : List.of()))
                            .build())
                    .build();

            return chain.filter(mutatedExchange);

        } catch (Exception e) {
            log.error("[GATEWAY-AUTH] ✗ Error validating token: {}", e.getMessage());
            return unauthenticated(exchange.getResponse(), "Token validation failed: " + e.getMessage());
        }
    }

    @Override
    public int getOrder() {
        return -1;
    }

    Mono<Void> unauthenticated(ServerHttpResponse response, String errorMessage) {
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        String body = String.format("{\"error\": \"%s\"}", errorMessage);
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes());
        return response.writeWith(Mono.just(buffer));
    }
    
    private boolean isPublicPath(String path) {
        if (path == null) {
            return false;
        }

        if (path.equals("/swagger-ui.html")
                || path.startsWith("/swagger-ui/")
                || path.startsWith("/webjars/")
                || path.startsWith("/v3/api-docs/")) {
            return true;
        }

        // Sử dụng AntPathMatcher để kiểm tra public endpoints
        AntPathMatcher matcher = new AntPathMatcher();
        return apiConfig.getPublicEndpoints().stream()
                .anyMatch(pattern -> matcher.match(pattern, path));
    }
}
