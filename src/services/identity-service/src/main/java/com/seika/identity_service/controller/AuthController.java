package com.seika.identity_service.controller;

import com.seika.identity_service.dto.auth.AuthResponse;
import com.seika.identity_service.dto.auth.LoginRequest;
import com.seika.identity_service.dto.auth.RegisterRequest;
import com.seika.identity_service.dto.auth.UserInfoResponse;
import com.seika.identity_service.service.AuthService;
import com.seika.identity_service.service.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserInfoResponse> me() {
        return ResponseEntity.ok(authService.me());
    }

    @PostMapping("/jwt-validate")
    public ResponseEntity<Boolean> jwtValidate(@RequestHeader(HttpHeaders.AUTHORIZATION) String authHeader){
        if(!authHeader.startsWith("Bearer ") || authHeader==null){
            return ResponseEntity.ok(false);
        }
        String token = authHeader.substring(7);
        return ResponseEntity.ok(jwtService.isValidToken(token));
    }
}
