package com.seika.profile_service.controller;

import com.seika.profile_service.dto.user_profile.UserProfileRequest;
import com.seika.profile_service.dto.user_profile.UserProfileResponse;
import com.seika.profile_service.service.UserProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class UserProfileController {

    private final UserProfileService userProfileService;

    @PostMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<UserProfileResponse> createUserProfile(@Valid @RequestBody UserProfileRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userProfileService.createUserProfile(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserProfileResponse>> getAllUserProfiles() {
        System.out.println("called");
        return ResponseEntity.ok(userProfileService.getAllUserProfiles());
    }

    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable String userId) {
        return ResponseEntity.ok(userProfileService.getUserProfileByUserId(userId));
    }
}
