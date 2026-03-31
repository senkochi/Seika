package com.seika.profile_service.mapper;

import com.seika.profile_service.dto.user_profile.UserProfileResponse;
import com.seika.profile_service.enity.UserProfile;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    UserProfileResponse toUserProfileResponse(UserProfile userProfile);

    List<UserProfileResponse> toUserProfileResponseList(List<UserProfile> userProfileList);
}
