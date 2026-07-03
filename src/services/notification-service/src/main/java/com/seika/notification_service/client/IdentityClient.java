package com.seika.notification_service.client;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class IdentityClient {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.services.identity:http://identity-service:8081}")
    private String identityServiceUrl;

    public List<String> getAdminUserIds() {
        try {
            String url = identityServiceUrl + "/api/auth/admin-ids";
            ResponseEntity<List<String>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<String>>() {}
            );
            return response.getBody() != null ? response.getBody() : Collections.emptyList();
        } catch (Exception e) {
            log.warn("Failed to fetch admin user IDs from primary URL ({}): {}. Trying localhost fallback...", identityServiceUrl, e.getMessage());
            try {
                String fallbackUrl = "http://localhost:8081/api/auth/admin-ids";
                ResponseEntity<List<String>> response = restTemplate.exchange(
                        fallbackUrl,
                        HttpMethod.GET,
                        null,
                        new ParameterizedTypeReference<List<String>>() {}
                );
                return response.getBody() != null ? response.getBody() : Collections.emptyList();
            } catch (Exception ex) {
                log.error("Failed to fetch admin user IDs from fallback URL: {}", ex.getMessage());
                return Collections.emptyList();
            }
        }
    }
}
