package com.seika.api_gateway.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIAggregationConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("http://localhost:8080").description("API Gateway (Development)"))
                .addServersItem(new Server().url("http://api-gateway:8080").description("API Gateway (Docker)"))
                .info(new Info()
                        .title("Seika Microservices API Gateway")
                        .version("1.0.0")
                        .description("Central API Gateway for Seika microservices platform. " +
                                "This gateway aggregates API documentation from all microservices: " +
                                "Identity, Profile, Wallet, Marketplace, Flashcard, Quiz, and Notification services.")
                        .contact(new Contact()
                                .name("Seika Development Team")
                                .url("https://seika.dev")
                                .email("dev@seika.example.com"))
                        .license(new License()
                                .name("MIT License")
                                .url("https://opensource.org/licenses/MIT")));
    }
}
