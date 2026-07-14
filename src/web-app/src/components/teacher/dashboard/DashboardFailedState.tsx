import { Button } from "../../ui/Button";
import { EmptyState } from "../../ui/EmptyState";

interface DashboardFailedStateProps {
  error: string | null;
  onRetry: () => void;
}

function DashboardFailedState({ error, onRetry }: DashboardFailedStateProps) {
  return (
    <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
      <div className="max-w-md w-full">
        <EmptyState
          title="Không thể tải hồ sơ giảng viên"
          description={error ?? "Đã xảy ra lỗi không xác định."}
          action={
            <Button variant="ghost" size="md" onClick={onRetry}>
              Thử lại
            </Button>
          }
        />
      </div>
    </div>
  );
}

export default DashboardFailedState;