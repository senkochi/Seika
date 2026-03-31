package com.seika.api_gateway.filter;

import com.seika.api_gateway.config.ApiConfig;
import com.seika.api_gateway.service.IdentityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;

import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
@Slf4j
@RequiredArgsConstructor
public class AuthenticationFilter implements GlobalFilter, Ordered {

    private static final String BEARER_PREFIX = "Bearer ";
    private final IdentityService identityService;
    private final ApiConfig apiConfig;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        log.info("Entering authentication filter ...");

        // Lấy path của request để kiểm tra có phải public không?
        // Nếu là public path thì bỏ qua filter này, không cần kiểm tra token
        String path = exchange.getRequest().getURI().getPath();
        if (isPublicPath(path)) {
            return chain.filter(exchange);
        }

        // Lấy header Authorization từ request 
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");

        // Kiểm tra rỗng và lấy token từ header
        if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
            return unauthenticated(exchange.getResponse());
        }
        String token = authHeader.substring(BEARER_PREFIX.length());

        // Gọi service để validate token, nếu valid thì tiếp tục chuỗi filter, nếu không valid thì trả về lỗi 401
        return identityService.validateToken(token)
                .flatMap(valid -> {
                    if (Boolean.TRUE.equals(valid)) {
                        return chain.filter(exchange);
                    }
                    return unauthenticated(exchange.getResponse());
                });
    }

    @Override
    public int getOrder() {
        return -1;
    }

    Mono<Void> unauthenticated(ServerHttpResponse response) {
        String body = "unauthenticated! please login again.";
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes());
        return response.writeWith(Mono.just(buffer));
    }
    
    private boolean isPublicPath(String path) {
        return apiConfig.getPublicEndpoints().stream().anyMatch(path::startsWith);
    }
}
