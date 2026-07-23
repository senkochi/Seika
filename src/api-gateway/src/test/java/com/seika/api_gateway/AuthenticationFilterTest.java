package com.seika.api_gateway;

import com.seika.api_gateway.config.ApiConfig;
import com.seika.api_gateway.filter.AuthenticationFilter;
import com.seika.api_gateway.shared.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthenticationFilterTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private ApiConfig apiConfig;

    @Mock
    private ReactiveStringRedisTemplate reactiveStringRedisTemplate;

    @Mock
    private GatewayFilterChain filterChain;

    private AuthenticationFilter authenticationFilter;

    @BeforeEach
    void setUp() {
        authenticationFilter = new AuthenticationFilter(jwtService, apiConfig, reactiveStringRedisTemplate);
    }

    @Test
    void testFilterValidTokenNotBlacklisted() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/protected/data")
                .header(HttpHeaders.AUTHORIZATION, "Bearer valid.jwt.token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtService.isValidToken("valid.jwt.token")).thenReturn(true);
        when(jwtService.extractJti("valid.jwt.token")).thenReturn("jti-123");
        when(jwtService.extractUsername("valid.jwt.token")).thenReturn("student_seika");
        when(jwtService.extractUserId("valid.jwt.token")).thenReturn("user-1");
        when(jwtService.extractRoles("valid.jwt.token")).thenReturn(List.of("STUDENT"));
        when(reactiveStringRedisTemplate.hasKey("auth:blacklist::jti-123")).thenReturn(Mono.just(false));
        when(filterChain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());

        StepVerifier.create(authenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain, times(1)).filter(any(ServerWebExchange.class));
    }

    @Test
    void testFilterValidTokenButBlacklistedReturns401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/protected/data")
                .header(HttpHeaders.AUTHORIZATION, "Bearer revoked.jwt.token")
                .build();
        ServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtService.isValidToken("revoked.jwt.token")).thenReturn(true);
        when(jwtService.extractJti("revoked.jwt.token")).thenReturn("jti-revoke-999");
        when(reactiveStringRedisTemplate.hasKey("auth:blacklist::jti-revoke-999")).thenReturn(Mono.just(true));

        StepVerifier.create(authenticationFilter.filter(exchange, filterChain))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
        verify(filterChain, never()).filter(any(ServerWebExchange.class));
    }
}
