package com.seika.profile_service.controller;

import com.seika.profile_service.dto.teacher_profile.TeacherProfileResponse;
import com.seika.profile_service.service.TeacherProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profiles/teacher")
@RequiredArgsConstructor
public class TeacherProfileController {

    private final TeacherProfileService teacherProfileService;

    /**
     * GET /api/profiles/teacher/me
     * Returns the authenticated teacher's full profile (personal info + game stats + teacher stats).
     */
    @GetMapping("/me")
    public ResponseEntity<TeacherProfileResponse> getMyTeacherProfile(Authentication authentication) {
        String userId = authentication.getPrincipal().toString();
        return ResponseEntity.ok(teacherProfileService.getTeacherProfile(userId));
    }

    /**
     * GET /api/profiles/teacher/{userId}
     * Public endpoint – returns teacher stats for a given userId (e.g., for a marketplace listing).
     */
    @GetMapping("/{userId}")
    public ResponseEntity<TeacherProfileResponse> getTeacherProfile(@PathVariable String userId) {
        return ResponseEntity.ok(teacherProfileService.getTeacherProfile(userId));
    }
}

