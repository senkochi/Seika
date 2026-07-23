import { RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ProfilePageHeaderProps {
  onRefresh: () => void;
}

function ProfilePageHeader({ onRefresh }: ProfilePageHeaderProps) {
  const { t } = useTranslation("teacher");
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">
          {t("profile.headerTitle")}
        </h1>
        <p className="text-[var(--muted-foreground)]">
          {t("profile.headerDesc")}
        </p>
      </div>
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] backdrop-blur-md px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
      >
        <RefreshCcw className="h-4 w-4" /> {t("profile.refresh")}
      </button>
    </div>
  );
}

export default ProfilePageHeader;
