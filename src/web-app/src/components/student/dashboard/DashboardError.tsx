interface DashboardErrorProps {
  error: string | null;
  onRetry: () => void;
}

function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="text-4xl">⚠️</div>
        <p className="text-[var(--foreground)] font-bold">
          Failed to load profile
        </p>
        <p className="text-[var(--muted-foreground)] text-sm">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-[var(--primary)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default DashboardError;