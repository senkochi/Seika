package com.cardy.walletService.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String BEARER_PREFIX = "Bearer ";
    private final JwtTokenService jwtTokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
            
            // No token provided - allow request to proceed to authorization filter
            if (authHeader == null || !authHeader.startsWith(BEARER_PREFIX)) {
                log.debug("No Bearer token found in request to {}", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            // Extract token
            String token = authHeader.substring(BEARER_PREFIX.length());
            
            // Validate token
            if (!jwtTokenService.isValidToken(token)) {
                log.warn("Invalid token provided for request to {}", request.getRequestURI());
                filterChain.doFilter(request, response);
                return;
            }

            // Extract user information from token
            String userId = jwtTokenService.extractUserId(token);
            List<String> roles = jwtTokenService.extractRoles(token);

            if (userId == null || userId.isEmpty()) {
                log.warn("Token does not contain userId claim");
                filterChain.doFilter(request, response);
                return;
            }

            // Decode token to Jwt object
            Jwt jwt = jwtTokenService.decodeToJwt(token);

            // Build authorities list with ROLE_ prefix
            List<SimpleGrantedAuthority> authorities = roles == null
                    ? List.of()
                    : roles.stream()
                    .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList());

            // Create authentication token using Jwt object as principal
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(jwt, null, authorities);
            
            // Set authentication in security context
            SecurityContextHolder.getContext().setAuthentication(authentication);
            log.debug("JWT authentication successful for user: {} with roles: {}", userId, roles);

        } catch (Exception e) {
            log.error("Error processing JWT token", e);
            // Continue without authentication - let authorization handle it
        }

        filterChain.doFilter(request, response);
    }
}
