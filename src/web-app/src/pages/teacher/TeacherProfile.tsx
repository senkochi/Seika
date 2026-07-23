import { useEffect, useState } from "react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { teacherProfileService } from "../../api";
import type { TeacherProfileResponse } from "../../api";

import ProfileLoadingScreen from "../../components/teacher/profile/ProfileLoadingScreen";
import ProfilePageHeader from "../../components/teacher/profile/ProfilePageHeader";
import TeacherAvatarCard from "../../components/teacher/profile/TeacherAvatarCard";
import TeacherProfileForm from "../../components/teacher/profile/TeacherProfileForm";
import TeacherAccomplishmentsCard from "../../components/teacher/profile/TeacherAccomplishmentsCard";
import { useTeacherStatCards } from "../../components/teacher/profile/useTeacherStatCards";
import TeacherTierBadge from "../../components/teacher/TeacherTierBadge";
import { useTeacherRating } from "../../components/teacher/useTeacherRating";

function TeacherProfile() {
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.userProfile);
  const { rating: teacherRating } = useTeacherRating(profileState.userId);

  const [teacherProfile, setTeacherProfile] =
    useState<TeacherProfileResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(false);

  useEffect(() => {
    if (profileState.status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, profileState.status]);

  const fetchTeacherProfile = async () => {
    setLoadingStats(true);
    setStatsError(false);
    try {
      const data = await teacherProfileService.getMyProfile();
      setTeacherProfile(data);
    } catch (err) {
      console.error("Failed to fetch teacher profile stats:", err);
      setStatsError(true);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleRefresh = async () => {
    dispatch(fetchCurrentUserProfile());
    await fetchTeacherProfile();
  };

  useEffect(() => {
    if (profileState.status === "succeeded") {
      fetchTeacherProfile();
    }
  }, [profileState.status]);

  const statCards = useTeacherStatCards(
    teacherProfile,
    profileState.exp ?? 0,
    loadingStats,
    statsError,
  );

  if (profileState.status === "loading") {
    return <ProfileLoadingScreen />;
  }

  const displayName =
    profileState.fullName ?? profileState.username ?? "Teacher";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <ProfilePageHeader onRefresh={handleRefresh} />

      <div className="grid md:grid-cols-3 gap-8">
        <TeacherAvatarCard
          profilePictureUrl={profileState.profilePictureUrl ?? undefined}
          displayName={displayName}
          username={profileState.username ?? undefined}
          gender={profileState.gender ?? undefined}
          level={teacherProfile?.level ?? profileState.level ?? undefined}
          exp={teacherProfile?.exp ?? profileState.exp ?? undefined}
        />

        <div className="md:col-span-2 space-y-6">
          <TeacherProfileForm
            userId={profileState.userId ?? undefined}
            profileId={profileState.profileId ?? undefined}
            initialFullName={profileState.fullName ?? ""}
            initialDateOfBirth={profileState.dateOfBirth ?? ""}
            initialGender={profileState.gender ?? "Other"}
            initialProfilePictureUrl={profileState.profilePictureUrl ?? ""}
            onSaved={() => dispatch(fetchCurrentUserProfile())}
          />

          <TeacherTierBadge rating={teacherRating} />

          <TeacherAccomplishmentsCard
            statCards={statCards}
            loadingStats={false}
            statsError={statsError}
          />
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
