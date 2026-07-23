import { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  Calendar,
  Edit3,
  Loader2,
  RefreshCcw,
  Save,
  User,
  Zap,
  Trophy,
  TrendingUp,
  HelpCircle,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchCurrentUserProfile } from "../../store/userProfileSlice";
import { userProfilesService } from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";
import { useTranslation } from "react-i18next";
import StatTile from "../../components/teacher/profile/StatTile";

function StudentProfile() {
  const { t } = useTranslation(["profile", "common"]);
  const dispatch = useAppDispatch();
  const profileState = useAppSelector((state) => state.userProfile);

  const {
    status,
    error,
    userId,
    username,
    fullName,
    dateOfBirth,
    gender,
    profilePictureUrl,
    level,
    exp,
    currentStreak,
    longestStreak,
    quizzesCompleted,
  } = profileState;

  const [isEditing, setIsEditing] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [formFullName, setFormFullName] = useState("");
  const [formDateOfBirth, setFormDateOfBirth] = useState("");
  const [formGender, setFormGender] = useState("Other");
  const [formProfilePictureUrl, setFormProfilePictureUrl] = useState("");

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCurrentUserProfile());
    }
  }, [dispatch, status]);

  // Sync form when status succeeded or edit state changes to false (reset)
  useEffect(() => {
    if (status === "succeeded" && !isEditing) {
      setFormFullName(fullName ?? "");
      setFormDateOfBirth(dateOfBirth ?? "");
      setFormGender(gender ?? "Other");
      setFormProfilePictureUrl(profilePictureUrl ?? "");
    }
  }, [status, fullName, dateOfBirth, gender, profilePictureUrl, isEditing]);

  const handleRefresh = () => {
    dispatch(fetchCurrentUserProfile());
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    if (!formFullName.trim()) return showError(t("profile:toast.updateError"));
    if (!formDateOfBirth) return showError(t("profile:toast.updateError"));

    try {
      setLoadingSubmit(true);
      await userProfilesService.update(userId, {
        userId,
        fullName: formFullName,
        dateOfBirth: formDateOfBirth,
        gender: formGender,
        profilePictureUrl: formProfilePictureUrl || undefined,
      });
      showSuccess(t("profile:toast.updateSuccess"));
      setIsEditing(false);
      dispatch(fetchCurrentUserProfile());
    } catch (err) {
      showError(t("profile:toast.updateError"));
      console.error(err);
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
          <Loader2
            className="w-10 h-10 animate-spin text-[var(--primary)]"
            aria-hidden="true"
          />
          <p>{t("profile:loading")}</p>
        </div>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle
            className="h-9 w-9 text-[var(--primary)]"
            aria-hidden="true"
          />
          <p className="font-semibold text-[var(--foreground)]">
            {t("profile:errorTitle")}
          </p>
          {error && (
            <p className="max-w-md text-sm text-[var(--muted-foreground)]">
              {error}
            </p>
          )}
          <button
            onClick={() => dispatch(fetchCurrentUserProfile())}
            className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] text-white px-4 py-2 text-sm font-bold hover:opacity-90 transition-all"
          >
            {t("profile:retryBtn")}
          </button>
        </div>
      </div>
    );
  }

  const displayName = fullName ?? username ?? "Student";

  const statCards = [
    {
      icon: HelpCircle,
      label: t("profile:stats.quizzesCompleted"),
      value: quizzesCompleted ?? 0,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      icon: Zap,
      label: t("profile:stats.currentStreak"),
      value: currentStreak ?? 0,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    {
      icon: Trophy,
      label: t("profile:stats.longestStreak"),
      value: longestStreak ?? 0,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    },
    {
      icon: TrendingUp,
      label: t("profile:stats.experience"),
      value: exp ?? 0,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    },
  ];

  const genderDisplay =
    gender === "Male"
      ? t("profile:gender.Male")
      : gender === "Female"
        ? t("profile:gender.Female")
        : gender === "Other"
          ? t("profile:gender.Other")
          : gender || "—";

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans-ui">
      {/* Profile Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">
            {t("profile:header.title")}
          </h1>
          <p className="text-[var(--muted-foreground)]">
            {t("profile:header.subtitle")}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
        >
          <RefreshCcw className="h-4 w-4" /> {t("common:actions.refresh")}
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Student Avatar Card */}
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 flex flex-col items-center justify-center text-center h-fit sticky top-8">
          <div className="relative mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-amber-400 overflow-hidden bg-[var(--second-card)] flex items-center justify-center shadow-lg shadow-amber-500/20">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt="Profile Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-[var(--foreground)]">
                  {displayName[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
              <span className="text-amber-900 font-black text-xs">Lv</span>
            </div>
          </div>

          <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
            {displayName}
          </h2>
          <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            {t("profile:card.verifiedStudent")}
          </p>
          <p className="text-[var(--muted-foreground)] text-xs mb-5">
            @{username}
          </p>

          <div className="w-full pt-4 border-t border-[var(--border)] text-left space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">
                {t("profile:card.levelLabel")}
              </span>
              <span className="font-bold text-[var(--foreground)] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md text-xs">
                {t("profile:card.levelBadge", { level: level ?? 1 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">
                {t("profile:card.xpLabel")}
              </span>
              <span className="font-semibold text-amber-400">
                {t("profile:card.xpValue", { xp: exp ?? 0 })}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--muted-foreground)]">
                {t("profile:card.gender")}
              </span>
              <span className="font-semibold text-[var(--foreground)]">
                {genderDisplay}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Form and Accomplishments */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form Card */}
          <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-8">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border)] pb-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <User className="w-5 h-5 text-[var(--primary)]" />
                {t("profile:form.title")}
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-900/40 text-purple-300 border border-purple-800 rounded-xl text-xs font-semibold hover:bg-purple-900/60 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t("profile:form.editBtn")}
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                  {t("profile:form.fullName")}
                </label>
                <input
                  type="text"
                  disabled={!isEditing}
                  required
                  value={formFullName}
                  onChange={(e) => setFormFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                    {t("profile:form.dob")}
                  </label>
                  <div className="relative">
                    <Calendar className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                    <input
                      type="date"
                      disabled={!isEditing}
                      required
                      value={formDateOfBirth}
                      onChange={(e) => setFormDateOfBirth(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                    {t("profile:form.gender")}
                  </label>
                  <select
                    disabled={!isEditing}
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value)}
                    className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option
                      value="Male"
                      className="bg-[#1c0f2e] text-[#faf6ee]"
                    >
                      {t("profile:gender.Male")}
                    </option>
                    <option
                      value="Female"
                      className="bg-[#1c0f2e] text-[#faf6ee]"
                    >
                      {t("profile:gender.Female")}
                    </option>
                    <option
                      value="Other"
                      className="bg-[#1c0f2e] text-[#faf6ee]"
                    >
                      {t("profile:gender.Other")}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                  {t("profile:form.avatarUrl")}
                </label>
                <input
                  type="url"
                  disabled={!isEditing}
                  placeholder={t("profile:form.avatarPlaceholder")}
                  value={formProfilePictureUrl}
                  onChange={(e) => setFormProfilePictureUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)] disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              {isEditing && (
                <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-[var(--border)] rounded-xl text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-all"
                  >
                    {t("profile:form.cancelBtn")}
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
                    {t("profile:form.saveBtn")}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Accomplishments Section */}
          <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                {t("profile:accomplishmentsTitle")}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {statCards.map((stat) => (
                <StatTile
                  key={stat.label}
                  icon={stat.icon}
                  label={stat.label}
                  value={stat.value}
                  color={stat.color}
                  bg={stat.bg}
                  border={stat.border}
                  isLoading={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
