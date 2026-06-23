package com.seika.profile_service.controller;

import com.seika.profile_service.dto.user_profile.UserProfileRequest;
import com.seika.profile_service.dto.user_profile.UserProfileResponse;
import com.seika.profile_service.service.UserProfileService;
import com.seika.profile_service.shared.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@RequiredArgsConstructor
@Slf4j
public class UserProfileController {

    private final UserProfileService userProfileService;

    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<UserProfileResponse>> createUserProfile(@Valid @RequestBody UserProfileRequest request) {
        log.info("Creating user profile for: {}", request.getFullName());
        UserProfileResponse response = userProfileService.createUserProfile(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created(response));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUserProfiles() {
        log.info("Fetching all user profiles");
        List<UserProfileResponse> profiles = userProfileService.getAllUserProfiles();
        return ResponseEntity.ok(ApiResponse.success(profiles));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(
            @PathVariable String userId,
            org.springframework.security.core.Authentication authentication) {
        
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean isOwner = userId.equals(authentication.getPrincipal());
        
        if (!isAdmin && !isOwner) {
            throw new org.springframework.security.access.AccessDeniedException("Access denied");
        }
        
        return ResponseEntity.ok(userProfileService.getUserProfileByUserId(userId));
    }
}
