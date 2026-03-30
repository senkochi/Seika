package com.seika.api_gateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Slf4j
public class IdentityService {

	private final WebClient.Builder webClientBuilder;

	public Mono<Boolean> validateToken(String token) {
		String url = "http://localhost:8080/identity/validateToken";
		log.info("url from service: " + url);
		return webClientBuilder.build()
				.post()
				.uri("lb://IDENTITY-SERVICE/api/auth/jwt-validate?token={token}", token)
				.retrieve()
				.bodyToMono(Boolean.class)
				.onErrorReturn(false);
	}
}
