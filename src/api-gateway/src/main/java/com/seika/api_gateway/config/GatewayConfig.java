package com.seika.api_gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    @Bean
    public RouteLocator customRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                // Identity Service - Public endpoints (login, register)
                .route("identity-auth-public", r -> r.path("/api/auth/login", "/api/auth/register", "/api/auth/refresh")
                        .uri("http://localhost:8081"))

                // Identity Service - Protected endpoints
                .route("identity-protected", r -> r.path("/identity/**")
                        .uri("lb://IDENTITY-SERVICE"))

                // Profile Service - Protected endpoints
                .route("profile-protected", r -> r.path("/api/profiles/**", "/api/profiles")
                        .uri("http://localhost:8082"))

                .route("wallet", r -> r.path("/api/wallet/**", "/api/wallet")
                        .uri("http://localhost:8083"))

                .build();
    }
}

