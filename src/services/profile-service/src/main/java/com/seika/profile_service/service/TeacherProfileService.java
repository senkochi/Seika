package com.seika.profile_service.service;

import com.seika.profile_service.dto.teacher_profile.TeacherProfileResponse;
import com.seika.profile_service.enity.GameProfile;
import com.seika.profile_service.enity.TeacherProfile;
import com.seika.profile_service.enity.UserProfile;
import com.seika.profile_service.exception.ResourceNotFoundException;
import com.seika.profile_service.repository.GameProfileRepository;
import com.seika.profile_service.repository.TeacherProfileRepository;
import com.seika.profile_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeacherProfileService {

    private final UserProfileRepository userProfileRepository;
    private final GameProfileRepository gameProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;

    @Transactional(readOnly = true)
    public TeacherProfileResponse getTeacherProfile(String userId) {
        log.info("Fetching teacher profile for userId={}", userId);

        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for userId: " + userId));

        GameProfile gameProfile = gameProfileRepository.findByUserId(userId)
                .orElse(new GameProfile());

        TeacherProfile teacherProfile = teacherProfileRepository.findByUserId(userId)
                .orElse(TeacherProfile.builder().userId(userId).build());

        return TeacherProfileResponse.builder()
                .id(userProfile.getId())
                .userId(userProfile.getUserId())
                .fullName(userProfile.getFullName())
                .dateOfBirth(userProfile.getDateOfBirth())
                .gender(userProfile.getGender())
                .profilePictureUrl(userProfile.getProfilePictureUrl())
                .exp(gameProfile.getExp())
                .level(gameProfile.getLevel())
                .totalQuizCreated(teacherProfile.getTotalQuizCreated())
                .totalFlashcardsCreated(teacherProfile.getTotalFlashcardsCreated())
                .totalStudentsReached(teacherProfile.getTotalStudentsReached())
                .build();
    }
}

