import { AlertCircle } from "lucide-react";
import { Button } from "../../ui/Button";

interface DashboardErrorProps {
  error: string | null;
  onRetry: () => void;
}

function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60dvh] font-sans-ui">
      <div className="flex flex-col items-center gap-3 text-center">
        <AlertCircle
          className="h-9 w-9 text-[#d4a843]"
          aria-hidden="true"
        />
        <p className="font-semibold text-cream">Không thể tải profile</p>
        {error && (
          <p className="max-w-md text-sm text-white/55">{error}</p>
        )}
        <Button variant="primary" size="md" onClick={onRetry} className="mt-2">
          Thử lại
        </Button>
      </div>
    </div>
  );
}

export default DashboardError;