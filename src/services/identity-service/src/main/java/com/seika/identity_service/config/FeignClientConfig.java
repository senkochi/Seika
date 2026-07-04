package com.seika.identity_service.config;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Forwards the current request's JWT to downstream Feign calls so that services
 * like marketplace/wallet can authorize admin-only endpoints.
 */
@Configuration
@Slf4j
public class FeignClientConfig {

    @Bean
    public RequestInterceptor jwtForwardingInterceptor() {
        return new RequestInterceptor() {
            @Override
            public void apply(RequestTemplate template) {
                try {
                    ServletRequestAttributes attrs =
                            (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
                    if (attrs == null) return;
                    HttpServletRequest req = attrs.getRequest();
                    String auth = req.getHeader(HttpHeaders.AUTHORIZATION);
                    if (auth != null && auth.startsWith("Bearer ")) {
                        template.header(HttpHeaders.AUTHORIZATION, auth);
                    }
                } catch (Exception e) {
                    log.debug("Skip JWT forward: {}", e.getMessage());
                }
            }
        };
    }
}