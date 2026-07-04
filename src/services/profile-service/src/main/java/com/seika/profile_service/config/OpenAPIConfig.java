package com.seika.profile_service.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenAPIConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .addServersItem(new Server().url("http://localhost:8080").description("API Gateway"))
                .addServersItem(new Server().url("http://profile-service:8082").description("Profile Service"))
                .info(new Info()
                        .title("Profile Service API")
                        .version("1.0.0")
                        .description("User profile management service for Seika platform")
                        .contact(new Contact()
                                .name("Seika Development Team")
                                .url("https://seika.dev")));
    }
}
