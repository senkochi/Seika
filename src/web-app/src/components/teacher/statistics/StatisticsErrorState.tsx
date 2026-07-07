import { RefreshCcw } from "lucide-react";

interface StatisticsErrorStateProps {
  message: string;
  onRetry: () => void;
}

function StatisticsErrorState({
  message,
  onRetry,
}: StatisticsErrorStateProps) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-[var(--foreground)] font-bold">
          Không thể tải thống kê
        </p>
        <p className="text-[var(--muted-foreground)] text-sm max-w-md">
          {message}
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          <RefreshCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    </div>
  );
}

export default StatisticsErrorState;