import { useEffect, useState } from "react";
import {
  User,
  Calendar,
  Award,
  Loader2,
  Save,
  Edit3,
  BookOpen,
  HelpCircle,
  Users,
  TrendingUp,
  Star,
  AlertTriangle,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { userProfilesService, teacherProfileService } from "../../api";
import type { TeacherProfileResponse } from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";

function TeacherProfile() {
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.userProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // Teacher stats state
  const [teacherProfile, setTeacherProfile] =
    useState<TeacherProfileResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    if (profileState.status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, profileState.status]);

  // Sync form fields from Redux
  useEffect(() => {
    if (profileState.status === "succeeded") {
      setFullName(profileState.fullName || "");
      setDateOfBirth(profileState.dateOfBirth || "");
      setGender(profileState.gender || "Other");
      setProfilePictureUrl(profileState.profilePictureUrl || "");
    }
  }, [profileState]);

  // Fetch teacher stats
  useEffect(() => {
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

    if (profileState.status === "succeeded") {
      fetchTeacherProfile();
    }
  }, [profileState.status]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileState.userId) return;

    if (!fullName.trim()) return showError("Họ tên là bắt buộc.");
    if (!dateOfBirth) return showError("Ngày sinh là bắt buộc.");

    setLoadingSubmit(true);
    try {
      if (profileState.profileId) {
        await userProfilesService.update(profileState.userId, {
          userId: profileState.userId,
          fullName,
          dateOfBirth,
          gender,
          profilePictureUrl: profilePictureUrl || undefined,
        });
      } else {
        await userProfilesService.create({
          userId: profileState.userId,
          fullName,
          dateOfBirth,
          gender,
          profilePictureUrl: profilePictureUrl || undefined,
        });
      }
      showSuccess("Cập nhật hồ sơ thành công!");
      setIsEditing(false);
      dispatch(fetchCurrentUserProfile());
    } catch (err) {
      console.error(err);
      showError("Cập nhật hồ sơ thất bại.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (profileState.status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
          <p>Đang tải hồ sơ của bạn...</p>
        </div>
      </div>
    );
  }

  const displayName =
    profileState.fullName ?? profileState.username ?? "Teacher";

  const statCards = [
    {
      icon: HelpCircle,
      label: "Bộ đề Quiz đã tạo",
      value: loadingStats
        ? "..."
        : statsError
          ? "–"
          : (teacherProfile?.totalQuizCreated ?? 0),
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: BookOpen,
      label: "Bộ Flashcard đã tạo",
      value: loadingStats
        ? "..."
        : statsError
          ? "–"
          : (teacherProfile?.totalFlashcardsCreated ?? 0),
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      icon: Users,
      label: "Học sinh tiếp cận",
      value: loadingStats
        ? "..."
        : statsError
          ? "–"
          : (teacherProfile?.totalStudentsReached ?? 0),
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: TrendingUp,
      label: "Kinh nghiệm (XP)",
      value: loadingStats
        ? "..."
        : statsError
          ? "–"
          : `${teacherProfile?.exp ?? profileState.exp ?? 0} XP`,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">
          Teacher Profile
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Quản lý thông tin cá nhân, huy hiệu và thống kê giảng dạy của bạn.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg shadow-black/20 h-fit sticky top-8">
          {/* Avatar */}
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-amber-400 overflow-hidden bg-[var(--second-card)] flex items-center justify-center shadow-lg shadow-amber-500/20">
              {profileState.profilePictureUrl ? (
                <img
                  src={profileState.profilePictureUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-[var(--foreground)]">
                  {displayName[0].toUpperCase()}
                </span>
              )}
            </div>
            {/* Badge overlay */}
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
              <Star className="w-4 h-4 text-amber-900 fill-amber-900" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
            {displayName}
          </h2>
          <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            Verified Teacher
          </p>
          <p className="text-[var(--muted-foreground)] text-xs mb-5">
            @{profileState.username}
          </p>

          <div className="w-full pt-4 border-t border-[var(--border)] text-left space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Level:</span>
              <span className="font-bold text-[var(--foreground)] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md text-xs">
                Lv. {teacherProfile?.level ?? profileState.level ?? 1}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">XP:</span>
              <span className="font-semibold text-amber-400">
                {teacherProfile?.exp ?? profileState.exp ?? 0} XP
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">Giới tính:</span>
              <span className="font-semibold text-[var(--foreground)]">
                {profileState.gender || "–"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Details Card */}
          <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 shadow-lg shadow-black/20">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--primary)]" />
                Thông tin cá nhân
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-900/60 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              )}
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                  Họ và tên
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                    Ngày sinh
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type="date"
                      disabled={!isEditing}
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                    Giới tính
                  </label>
                  <select
                    disabled={!isEditing}
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="Male" className="bg-[var(--card)]">
                      Nam
                    </option>
                    <option value="Female" className="bg-[var(--card)]">
                      Nữ
                    </option>
                    <option value="Other" className="bg-[var(--card)]">
                      Khác
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                  URL ảnh đại diện
                </label>
                <input
                  type="url"
                  disabled={!isEditing}
                  placeholder="https://example.com/avatar.jpg"
                  value={profilePictureUrl}
                  onChange={(e) => setProfilePictureUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {isEditing && (
                <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(profileState.fullName || "");
                      setDateOfBirth(profileState.dateOfBirth || "");
                      setGender(profileState.gender || "Other");
                      setProfilePictureUrl(
                        profileState.profilePictureUrl || "",
                      );
                    }}
                    className="px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loadingSubmit}
                    className="px-8 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    {loadingSubmit ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Teacher Accomplishments */}
          <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-lg shadow-black/20">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Thành tích Giảng dạy
              </h3>
              {statsError && (
                <div className="flex items-center gap-1.5 text-xs text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Không thể tải thống kê
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {statCards.map((stat, idx) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={idx}
                    className={`p-5 ${stat.bg} border ${stat.border} rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02]`}
                  >
                    <div className={`p-2.5 rounded-xl bg-black/20`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div>
                      <p className={`text-2xl font-black ${stat.color}`}>
                        {loadingStats ? (
                          <span className="inline-block w-8 h-7 bg-white/10 rounded animate-pulse" />
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="text-xs text-[var(--muted-foreground)] mt-0.5 leading-tight">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
