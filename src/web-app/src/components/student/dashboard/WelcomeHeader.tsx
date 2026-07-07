import { RefreshCcw } from "lucide-react";

interface WelcomeHeaderProps {
  displayName: string;
  onRefresh: () => void;
}

function WelcomeHeader({ displayName, onRefresh }: WelcomeHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Welcome back, {displayName}!
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Here's what's happening with your learning today.
        </p>
      </div>
      <button
        onClick={onRefresh}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
      >
        <RefreshCcw className="h-4 w-4" /> Làm mới
      </button>
    </div>
  );
}

export default WelcomeHeader;