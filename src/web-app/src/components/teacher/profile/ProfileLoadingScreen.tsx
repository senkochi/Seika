import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

function ProfileLoadingScreen() {
  const { t } = useTranslation("teacher");
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-[var(--muted-foreground)]">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)]" />
        <p>{t("profile.loadingProfile")}</p>
      </div>
    </div>
  );
}

export default ProfileLoadingScreen;
