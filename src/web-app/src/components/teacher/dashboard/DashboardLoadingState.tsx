import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

function DashboardLoadingState() {
  const { t } = useTranslation("teacher");
  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-white/55 font-sans-ui">
        <Loader2
          className="w-8 h-8 animate-spin text-[#d4a843]"
          aria-hidden="true"
        />
        <p>{t("loading.dashboard")}</p>
      </div>
    </div>
  );
}

export default DashboardLoadingState;
