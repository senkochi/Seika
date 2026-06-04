package com.seika.api_gateway.config;

import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiRouteConfig {

    @Bean
    public RouteLocator openApiRouteLocator(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("openapi-identity", route -> route
                        .path("/v3/api-docs/identity-service", "/v3/api-docs/identity-service/**")
                        .filters(filter -> filter.rewritePath("/v3/api-docs/identity-service(?:/.*)?", "/v3/api-docs"))
                        .uri("lb://IDENTITY-SERVICE"))
                .route("openapi-flashcard", route -> route
                        .path("/v3/api-docs/flashcard-service", "/v3/api-docs/flashcard-service/**")
                        .filters(filter -> filter.rewritePath("/v3/api-docs/flashcard-service(?:/.*)?", "/v3/api-docs"))
                        .uri("lb://FLASHCARD-SERVICE"))
                .route("openapi-profile", route -> route
                        .path("/v3/api-docs/profile-service", "/v3/api-docs/profile-service/**")
                        .filters(filter -> filter.rewritePath("/v3/api-docs/profile-service(?:/.*)?", "/v3/api-docs"))
                        .uri("lb://PROFILE-SERVICE"))
                .route("openapi-wallet", route -> route
                        .path("/v3/api-docs/wallet-service", "/v3/api-docs/wallet-service/**")
                        .filters(filter -> filter.rewritePath("/v3/api-docs/wallet-service(?:/.*)?", "/v3/api-docs"))
                        .uri("lb://WALLET-SERVICE"))
                .route("openapi-marketplace", route -> route
                        .path("/v3/api-docs/marketplace-service", "/v3/api-docs/marketplace-service/**")
                        .filters(filter -> filter.rewritePath("/v3/api-docs/marketplace-service(?:/.*)?", "/v3/api-docs"))
                        .uri("lb://MARKETPLACE-SERVICE"))
                .route("openapi-quiz", route -> route
                        .path("/v3/api-docs/quiz-service", "/v3/api-docs/quiz-service/**")
                        .filters(filter -> filter.rewritePath("/v3/api-docs/quiz-service(?:/.*)?", "/v3/api-docs"))
                        .uri("lb://QUIZ-SERVICE"))
                .route("openapi-notification", route -> route
                        .path("/v3/api-docs/notification-service", "/v3/api-docs/notification-service/**")
                        .filters(filter -> filter.rewritePath("/v3/api-docs/notification-service(?:/.*)?", "/v3/api-docs"))
                        .uri("lb://NOTIFICATION-SERVICE"))
                .build();
    }
}