package com.seika.api_gateway.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.webflux.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
@Order(-2)
@Slf4j
public class GlobalExceptionHandler implements ErrorWebExceptionHandler {

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        log.error("Global exception handler caught exception: ", ex);

        HttpStatus httpStatus;
        String message;

        if (ex instanceof IllegalArgumentException) {
            httpStatus = HttpStatus.BAD_REQUEST;
            message = "Invalid request: " + ex.getMessage();
        } else if (ex instanceof org.springframework.security.access.AccessDeniedException) {
            httpStatus = HttpStatus.FORBIDDEN;
            message = "Access denied";
        } else {
            httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
            message = "Internal server error: " + ex.getMessage();
        }

        exchange.getResponse().setStatusCode(httpStatus);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        String errorResponse = String.format(
                "{\"status\": %d, \"error\": \"%s\", \"message\": \"%s\"}",
                httpStatus.value(),
                httpStatus.getReasonPhrase(),
                message
        );

        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(errorResponse.getBytes(StandardCharsets.UTF_8));

        return exchange.getResponse().writeWith(Mono.just(buffer));
    }
}
