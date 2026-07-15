import { Star } from "lucide-react";

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
        Verified Teacher
      </p>
      <p className="text-[var(--muted-foreground)] text-xs mb-5">@{username}</p>

      <div className="w-full pt-4 border-t border-[var(--border)] text-left space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-[var(--muted-foreground)]">Level:</span>
          <span className="font-bold text-[var(--foreground)] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-md text-xs">
            Lv. {level ?? 1}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--muted-foreground)]">XP:</span>
          <span className="font-semibold text-amber-400">{exp ?? 0} XP</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[var(--muted-foreground)]">Giới tính:</span>
          <span className="font-semibold text-[var(--foreground)]">
            {gender || "–"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TeacherAvatarCard;
