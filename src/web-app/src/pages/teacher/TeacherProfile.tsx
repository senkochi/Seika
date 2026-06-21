import { useEffect, useState } from "react";
import {
  User,
  Calendar,
  Award,
  Loader2,
  Sparkles,
  Save,
  Edit3,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { userProfilesService } from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";

function TeacherProfile() {
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.userProfile);

  const [isEditing, setIsEditing] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  // State các trường nhập
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [profilePictureUrl, setProfilePictureUrl] = useState("");

  useEffect(() => {
    if (profileState.status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, profileState.status]);

  // Sync state từ Redux store sang form state
  useEffect(() => {
    if (profileState.status === "succeeded") {
      setFullName(profileState.fullName || "");
      setDateOfBirth(profileState.dateOfBirth || "");
      setGender(profileState.gender || "Other");
      setProfilePictureUrl(profileState.profilePictureUrl || "");
    }
  }, [profileState]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileState.userId) return;

    if (!fullName.trim()) {
      return showError("Full Name is required.");
    }
    if (!dateOfBirth) {
      return showError("Date of Birth is required.");
    }

    setLoadingSubmit(true);
    try {
      await userProfilesService.create({
        userId: profileState.userId,
        fullName: fullName,
        dateOfBirth: dateOfBirth,
        gender: gender,
        profilePictureUrl: profilePictureUrl || undefined,
      });

      showSuccess("Profile updated successfully!");
      setIsEditing(false);
      // Fetch lại thông tin profile mới nhất về Redux store
      dispatch(fetchCurrentUserProfile());
    } catch (err) {
      console.error(err);
      showError("Failed to update profile.");
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (profileState.status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const displayName =
    profileState.fullName ?? profileState.username ?? "Teacher";

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">
          Teacher Profile
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Manage your personal details, teaching credentials, and avatar frame.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Quick Info */}
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg shadow-black/20 h-fit">
          <div className="relative group w-32 h-32 rounded-full border-4 border-amber-400 overflow-hidden mb-4 bg-[var(--second-card)] flex items-center justify-center">
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

          <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-1.5 justify-center mb-1">
            {displayName}
          </h2>
          <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-4">
            Verified Teacher
          </p>

          <div className="w-full pt-4 border-t border-[var(--border)] text-left space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Username:</span>
              <span className="font-semibold text-[var(--foreground)]">
                {profileState.username}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Experience:
              </span>
              <span className="font-semibold text-[var(--foreground)]">
                {profileState.exp} XP
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">Level:</span>
              <span className="font-semibold text-[var(--foreground)]">
                Lv. {profileState.level}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Profile details form */}
        <div className="md:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8 shadow-lg shadow-black/20">
          <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
            <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
              <User className="w-5 h-5 text-[var(--primary)]" />
              Personal Details
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-900/60"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Profile
              </button>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                Full Name
              </label>
              <input
                type="text"
                disabled={!isEditing}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                  Date of Birth
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
                  Gender
                </label>
                <select
                  disabled={!isEditing}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Male" className="bg-[var(--card)]">
                    Male
                  </option>
                  <option value="Female" className="bg-[var(--card)]">
                    Female
                  </option>
                  <option value="Other" className="bg-[var(--card)]">
                    Other
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                Profile Picture URL
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
                    // Reset values
                    setFullName(profileState.fullName || "");
                    setDateOfBirth(profileState.dateOfBirth || "");
                    setGender(profileState.gender || "Other");
                    setProfilePictureUrl(profileState.profilePictureUrl || "");
                  }}
                  className="px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loadingSubmit}
                  className="px-8 py-2.5 bg-[var(--primary)] text-white rounded-xl text-sm font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingSubmit ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Stats and Badges Section */}
      <div className="mt-8 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-lg shadow-black/20">
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Teacher Accomplishments
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl text-center">
            <p className="text-2xl text-yellow-400 font-black">100%</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Verified Status
            </p>
          </div>
          <div className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl text-center">
            <p className="text-2xl text-purple-400 font-black">5.0 ★</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Classroom Rating
            </p>
          </div>
          <div className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl text-center">
            <p className="text-2xl text-blue-400 font-black">12</p>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Published Materials
            </p>
          </div>
          <div className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl text-center">
            <div className="flex items-center justify-center gap-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <p className="text-xl text-yellow-400 font-black">Gold</p>
            </div>
            <p className="text-xs text-[var(--muted-foreground)] mt-1">
              Partner Tier
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherProfile;
