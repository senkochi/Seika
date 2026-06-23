package com.seika.identity_service.controller;

import com.seika.identity_service.dto.auth.AuthResponse;
import com.seika.identity_service.dto.auth.IntrospectResponse;
import com.seika.identity_service.dto.auth.LoginRequest;
import com.seika.identity_service.dto.auth.RefreshTokenRequest;
import com.seika.identity_service.dto.auth.RegisterRequest;
import com.seika.identity_service.dto.auth.UserInfoResponse;
import com.seika.identity_service.service.AuthService;
import com.seika.identity_service.service.JwtService;
import com.seika.identity_service.shared.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.register(request)));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserInfoResponse>> me() {
        return ResponseEntity.ok(ApiResponse.success(authService.me()));
    }

    @PostMapping("/jwt-introspect")
    public ResponseEntity<ApiResponse<IntrospectResponse>> jwtIntrospect(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.ok(ApiResponse.success(IntrospectResponse.builder().valid(false).build()));
        }
        String token = authHeader.substring(7);
        if (!jwtService.isValidToken(token)) {
            return ResponseEntity.ok(ApiResponse.success(IntrospectResponse.builder().valid(false).build()));
        }
        return ResponseEntity.ok(ApiResponse.success(IntrospectResponse.builder()
                .valid(true)
                .username(jwtService.extractUsername(token))
                .roles(jwtService.extractRoles(token))
                .userId(jwtService.extractUserId(token))
                .build()));
    }
}
