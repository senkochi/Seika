package com.cardy.walletService.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.Enumeration;
import java.util.UUID;

@Component
@Slf4j
public class GlobalLoggingFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String REQUEST_ID_MDC = "requestId";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Create request ID if not present
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        if (requestId == null || requestId.isEmpty()) {
            requestId = UUID.randomUUID().toString();
        }

        // Wrap request and response to capture body
        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request, 10);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            // Log incoming request
            logIncomingRequest(requestId, requestWrapper);

            // Continue filter chain
            filterChain.doFilter(requestWrapper, responseWrapper);

            // Log outgoing response
            long duration = System.currentTimeMillis() - startTime;
            logOutgoingResponse(requestId, requestWrapper, responseWrapper, duration);

        } finally {
            // Copy response content back to original response
            responseWrapper.copyBodyToResponse();
        }
    }

    private void logIncomingRequest(String requestId, ContentCachingRequestWrapper request) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n=== INCOMING REQUEST [").append(requestId).append("] ===\n");
        sb.append("Method: ").append(request.getMethod()).append("\n");
        sb.append("URI: ").append(request.getRequestURI()).append("\n");

        // Log headers
        Enumeration<String> headerNames = request.getHeaderNames();
        if (headerNames.hasMoreElements()) {
            sb.append("Headers:\n");
            while (headerNames.hasMoreElements()) {
                String headerName = headerNames.nextElement();
                String headerValue = headerName.equalsIgnoreCase("Authorization") 
                        ? "***" 
                        : request.getHeader(headerName);
                sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
            }
        }

        // Log request body for specific content types
        if (isLoggableContentType(request.getContentType())) {
            byte[] content = request.getContentAsByteArray();
            if (content.length > 0) {
                sb.append("Body: ").append(new String(content)).append("\n");
            }
        }

        sb.append("=== END INCOMING REQUEST ===");
        log.info(sb.toString());
    }

    private void logOutgoingResponse(String requestId, ContentCachingRequestWrapper request,
                                    ContentCachingResponseWrapper response, long duration) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n=== OUTGOING RESPONSE [").append(requestId).append("] ===\n");
        sb.append("Status: ").append(response.getStatus()).append("\n");
        sb.append("Duration: ").append(duration).append("ms\n");

        // Log response headers
        response.getHeaderNames().forEach(headerName -> {
            String headerValue = headerName.equalsIgnoreCase("Authorization")
                    ? "***"
                    : response.getHeader(headerName);
            sb.append("  ").append(headerName).append(": ").append(headerValue).append("\n");
        });

        // Log response body for specific content types
        if (isLoggableContentType(response.getContentType())) {
            byte[] content = response.getContentAsByteArray();
            if (content.length > 0) {
                String responseBody = new String(content);
                sb.append("Body: ").append(responseBody).append("\n");
            }
        }

        sb.append("=== END OUTGOING RESPONSE ===");
        
        if (response.getStatus() >= 400) {
            log.error(sb.toString());
        } else {
            log.info(sb.toString());
        }
    }

    private boolean isLoggableContentType(String contentType) {
        if (contentType == null) {
            return false;
        }
        return contentType.contains("application/json") ||
               contentType.contains("application/xml") ||
               contentType.contains("text/plain");
    }
}
