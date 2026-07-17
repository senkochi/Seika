import { useTranslation } from "react-i18next";
import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";

interface DashboardFailedStateProps {
  error: string | null;
  onRetry: () => void;
}

function DashboardFailedState({ error, onRetry }: DashboardFailedStateProps) {
  const { t } = useTranslation("teacher");
  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full">
        <EmptyState
          title={t("error.dashboardTitle")}
          description={error ?? t("error.defaultMsg")}
          action={
            <Button variant="ghost" size="md" onClick={onRetry}>
              {t("error.retry")}
            </Button>
          }
        />
      </div>
    </div>
  );
}

export default DashboardFailedState;
