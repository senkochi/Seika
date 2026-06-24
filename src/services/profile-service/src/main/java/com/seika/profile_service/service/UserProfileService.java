package com.seika.profile_service.service;

import com.seika.profile_service.dto.user_profile.UserProfileRequest;
import com.seika.profile_service.dto.user_profile.UserProfileResponse;
import com.seika.profile_service.enity.GameProfile;
import com.seika.profile_service.enity.TeacherProfile;
import com.seika.profile_service.enity.UserProfile;
import com.seika.profile_service.exception.ConflictException;
import com.seika.profile_service.exception.ResourceNotFoundException;
import com.seika.profile_service.mapper.UserProfileMapper;
import com.seika.profile_service.repository.GameProfileRepository;
import com.seika.profile_service.repository.TeacherProfileRepository;
import com.seika.profile_service.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserProfileService {
    private final UserProfileRepository userProfileRepository;
    private final UserProfileMapper userProfileMapper;
    private final GameProfileRepository gameProfileRepository;
    private final TeacherProfileRepository teacherProfileRepository;

    @Transactional
    public UserProfileResponse createUserProfile(UserProfileRequest request) {
        if (userProfileRepository.existsByUserId(request.getUserId())) {
            throw new ConflictException("Profile already exists for userId: " + request.getUserId());
        }

        // Tạo và lưu UserProfile mới
        UserProfile userProfile = UserProfile.builder()
            .userId(request.getUserId())
            .fullName(request.getFullName())
            .dateOfBirth(request.getDateOfBirth())
            .gender(request.getGender())
            .profilePictureUrl(request.getProfilePictureUrl())
            .build();

        // Tạo và lưu GameProfile mới với thông tin default
        GameProfile gameProfile = GameProfile.builder()
            .userId(request.getUserId())
            .exp(0)
            .level(1) 
            .currentStreak(0)
            .longestStreak(0)
            .quizzesCompleted(0)
            .lastActiveDate(null)
            .build();

        UserProfile savedUserProfile = userProfileRepository.save(userProfile);
        GameProfile saveGameProfile =  gameProfileRepository.save(gameProfile);

        // Auto-create TeacherProfile if the user is a TEACHER
        if ("TEACHER".equalsIgnoreCase(request.getRole())) {
            TeacherProfile teacherProfile = TeacherProfile.builder()
                .userId(request.getUserId())
                .build();
            teacherProfileRepository.save(teacherProfile);
            log.info("Created TeacherProfile for userId={}", request.getUserId());
        }

        log.info("Created profile for userId={}", savedUserProfile.getUserId());
        return userProfileMapper.toUserProfileResponse(savedUserProfile, saveGameProfile);
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getUserProfileByUserId(String userId) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for userId: " + userId));

        GameProfile gameProfile = gameProfileRepository.findByUserId(userId).orElse(new GameProfile());
        return userProfileMapper.toUserProfileResponse(profile, gameProfile);
    }

    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUserProfiles() {
        List<UserProfile> userProfileList = userProfileRepository.findAll();

        List<String> userIds = userProfileList.stream()
                .map(UserProfile::getUserId)
                .toList();

        List<GameProfile> gameProfileList = gameProfileRepository.findAllById(userIds);

        Map<String, GameProfile> gameProfileMap = gameProfileList.stream()
                .collect(Collectors.toMap(GameProfile::getUserId, gameProfile -> gameProfile));

        return userProfileList.stream()
                .map(userProfile -> {
                    GameProfile gameProfile = gameProfileMap.getOrDefault(userProfile.getUserId(), new GameProfile());

                    return userProfileMapper.toUserProfileResponse(userProfile, gameProfile);
                })
                .toList();
    }

    @Transactional
    public UserProfileResponse updateUserProfile(String userId, UserProfileRequest request) {
        UserProfile userProfile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Profile not found for userId: " + userId));

        userProfile.setFullName(request.getFullName());
        userProfile.setDateOfBirth(request.getDateOfBirth());
        userProfile.setGender(request.getGender());
        userProfile.setProfilePictureUrl(request.getProfilePictureUrl());

        UserProfile savedUserProfile = userProfileRepository.save(userProfile);
        GameProfile gameProfile = gameProfileRepository.findByUserId(userId).orElse(new GameProfile());

        log.info("Updated profile for userId={}", userId);
        return userProfileMapper.toUserProfileResponse(savedUserProfile, gameProfile);
    }
}
