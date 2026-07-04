package com.seika.profile_service.mapper;

import com.seika.profile_service.dto.user_profile.UserProfileResponse;
import com.seika.profile_service.enity.GameProfile;
import com.seika.profile_service.enity.UserProfile;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UserProfileMapper {
    @Mapping(target = "userId", source = "userProfile.userId")
    UserProfileResponse toUserProfileResponse(UserProfile userProfile, GameProfile gameProfile);

    List<UserProfileResponse> toUserProfileResponseList(List<UserProfile> userProfileList);
}
