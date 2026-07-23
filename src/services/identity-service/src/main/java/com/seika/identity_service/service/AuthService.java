package com.seika.identity_service.service;

import com.seika.identity_service.dto.auth.AuthResponse;
import com.seika.identity_service.dto.auth.LoginRequest;
import com.seika.identity_service.dto.auth.RefreshTokenRequest;
import com.seika.identity_service.dto.auth.RegisterRequest;
import com.seika.identity_service.dto.auth.UserInfoResponse;
import com.seika.identity_service.entity.RefreshToken;
import com.seika.identity_service.dto.user_profile.UserProfileRequest;
import com.seika.identity_service.entity.Role;
import com.seika.identity_service.entity.User;
import com.seika.identity_service.exception.ConflictException;
import com.seika.identity_service.exception.InvalidRequestException;
import com.seika.identity_service.exception.ResourceNotFoundException;
import com.seika.identity_service.exception.TokenInvalidException;
import com.seika.identity_service.mapper.AuthMapper;
import com.seika.identity_service.mapper.ProfileMapper;
import com.seika.identity_service.repository.RefreshTokenRepository;
import com.seika.identity_service.repository.RoleRepository;
import com.seika.identity_service.repository.UserRepository;
import com.seika.identity_service.repository.httpclient.ProfileClient;
import com.seika.identity_service.security.CustomUserDetails;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    public static final String ROLE_STUDENT = "STUDENT";
    public static final String ROLE_TEACHER = "TEACHER";
    public static final Set<String> SELF_SELECTABLE_ROLES = Set.of(ROLE_STUDENT, ROLE_TEACHER);

 
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final ProfileClient profileClient;
    private final ProfileMapper profileMapper;
    private final AuthMapper authMapper;
    private final UserEventPublisher userEventPublisher;
    private final TokenBlacklistService tokenBlacklistService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            log.warn("Registration failed: Username {} already exists", request.getUsername());
            throw new ConflictException("Username đã tồn tại: " + request.getUsername());
        }

        Role selectedRole = resolveSelfSelectableRole(request.getRole());

        User user = authMapper.toUser(request, passwordEncoder.encode(request.getPassword()), Set.of(selectedRole));
        User savedUser = userRepository.save(user);
        log.info("User registered with username={}, role={}", user.getUsername(), selectedRole.getName());

        UserProfileRequest userProfileRequest = profileMapper.toUserProfileRequest(request, savedUser.getId());
        try {
            profileClient.createProfile(userProfileRequest);
            log.info("Profile created for userId={}", savedUser.getId());
        } catch (FeignException exception) {
            log.error("Profile creation failed for userId={} with status={}", savedUser.getId(), exception.status());
            throw new InvalidRequestException("Không thể tạo user profile. Đăng ký đã được rollback.");
        }
        
        List<GrantedAuthority> authorities = savedUser.getRoles().stream()
            .map(Role::getName)
            .map(roleName -> new SimpleGrantedAuthority("ROLE_" + roleName))
            .collect(Collectors.toList());
        Authentication authentication = new UsernamePasswordAuthenticationToken(new CustomUserDetails(savedUser), null, authorities);
        String accessToken = jwtService.generateAccessToken(authentication);
        String refreshToken = refreshTokenService.createTokenForUser(savedUser);

        userEventPublisher.publishUserRegistered(savedUser);

        return authMapper.toAuthResponse(savedUser, accessToken, refreshToken);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getUsername()));

        String accessToken = jwtService.generateAccessToken(authentication);
        String refreshToken = refreshTokenService.createTokenForUser(user);
        log.info("User logged in: username={}, roles={}", user.getUsername(), authMapper.mapRoleNames(user.getRoles()));
        return authMapper.toAuthResponse(user, accessToken, refreshToken);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new TokenInvalidException("Refresh token không hợp lệ"));

        if (refreshToken.isRevoked()) {
            throw new TokenInvalidException("Refresh token đã bị thu hồi");
        }

        if (refreshTokenService.isExpired(refreshToken)) {
            throw new TokenInvalidException("Refresh token đã hết hạn");
        }

        User user = refreshToken.getUser();
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(Role::getName)
                .map(roleName -> new SimpleGrantedAuthority("ROLE_" + roleName))
                .collect(Collectors.toList());
        Authentication authentication = new UsernamePasswordAuthenticationToken(new CustomUserDetails(user), null, authorities);

        String accessToken = jwtService.generateAccessToken(authentication);
        refreshTokenService.revokeToken(refreshToken);
        String newRefreshToken = refreshTokenService.createTokenForUser(user);

        log.info("Refreshed token for username={}", user.getUsername());
        return authMapper.toAuthResponse(user, accessToken, newRefreshToken);
    }

    public UserInfoResponse me() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", username));

        return authMapper.toUserInfoResponse(user);
    }

    public List<String> getAdminUserIds() {
        return userRepository.findByRoles_Name("ADMIN").stream()
                .map(User::getId)
                .collect(Collectors.toList());
    }

    @Transactional
    public void logout(String authHeader, RefreshTokenRequest request) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String accessToken = authHeader.substring(7);
            try {
                String jti = jwtService.extractJti(accessToken);
                Date expiration = jwtService.extractExpiration(accessToken);
                tokenBlacklistService.blacklistToken(jti, expiration);
            } catch (Exception e) {
                log.warn("Could not blacklist access token during logout: {}", e.getMessage());
            }
        }

        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            refreshTokenRepository.findByToken(request.getRefreshToken())
                    .ifPresent(refreshToken -> {
                        refreshTokenService.revokeToken(refreshToken);
                        log.info("Revoked refresh token during logout for user={}", refreshToken.getUser().getUsername());
                    });
        }
    }

    private Role resolveSelfSelectableRole(String rawRole) {
        String normalizedRole = rawRole == null ? "" : rawRole.trim().toUpperCase(Locale.ROOT);
        if (!SELF_SELECTABLE_ROLES.contains(normalizedRole)) {
            log.warn("Registration failed: Invalid role attempted - {}", rawRole);
            throw new InvalidRequestException("Chỉ có thể chọn STUDENT hoặc TEACHER khi đăng ký");
        }

        return roleRepository.findById(normalizedRole)
                .orElseThrow(() -> new ResourceNotFoundException("Role", normalizedRole));
    }
}
