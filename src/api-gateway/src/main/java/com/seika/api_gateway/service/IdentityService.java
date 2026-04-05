package com.seika.api_gateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpHeaders;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import com.seika.api_gateway.dto.auth.IntrospectResponse;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdentityService {

	private final WebClient.Builder webClientBuilder;

    public Mono<IntrospectResponse> introspectToken(String token) {
        return webClientBuilder.build()
                .post()
                .uri("lb://IDENTITY-SERVICE/api/auth/jwt-introspect")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + token)
                .retrieve()
                .bodyToMono(IntrospectResponse.class) // Chuyển đổi ResponseEntity<IntrospectResponse> thành Mono<IntrospectResponse> để dễ dàng xử lý trong chuỗi reactive
                .onErrorReturn(IntrospectResponse.builder().valid(false).build());
    }
}
