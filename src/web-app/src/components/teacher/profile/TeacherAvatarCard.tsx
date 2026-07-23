import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

interface TeacherAvatarCardProps {
  profilePictureUrl?: string | null;
  displayName: string;
  username?: string | null;
  gender?: string | null;
  level?: number | null;
  exp?: number | null;
}

function TeacherAvatarCard({
  profilePictureUrl,
  displayName,
  username,
  gender,
  level,
  exp,
}: TeacherAvatarCardProps) {
  const { t } = useTranslation("teacher");
  const genderDisplay =
    gender === "Male"
      ? t("profile.genderMale")
      : gender === "Female"
        ? t("profile.genderFemale")
        : gender === "Other"
          ? t("profile.genderOther")
          : gender || t("profile.genderFallback");

  return (
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
          <Star className="w-4 h-4 text-amber-900 fill-amber-900" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">
        {displayName}
      </h2>
      <p className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
        {t("profile.verifiedTeacher")}
      </p>
      <p className="text-[var(--muted-foreground)] text-xs mb-5">@{username}</p>

      <div className="w-full pt-4 border-t border-[var(--border)] text-left space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--muted-foreground)]">
            {t("profile.levelLabel")}
          </span>
          <span className="font-bold text-[var(--foreground)] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md text-xs">
            {t("profile.levelBadge", { level: level ?? 1 })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--muted-foreground)]">
            {t("profile.xpLabel")}
          </span>
          <span className="font-semibold text-amber-400">
            {t("profile.xpValue", { xp: exp ?? 0 })}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--muted-foreground)]">
            {t("profile.genderLabel")}
          </span>
          <span className="font-semibold text-[var(--foreground)]">
            {genderDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TeacherAvatarCard;
