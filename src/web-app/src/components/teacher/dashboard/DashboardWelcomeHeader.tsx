import { PlusCircle, RefreshCcw } from "lucide-react";

interface DashboardWelcomeHeaderProps {
  displayName: string;
  onRefresh: () => void;
  onCreateMaterial: () => void;
}

function DashboardWelcomeHeader({
  displayName,
  onRefresh,
  onCreateMaterial,
}: DashboardWelcomeHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] mb-2">
          Welcome back, {displayName}!
        </h1>
        <p className="text-[var(--muted-foreground)]">
          Here is your teaching dashboard overview and Marketplace earnings
          today.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-3 border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] font-bold text-sm rounded-xl hover:border-[var(--primary)] transition-colors"
        >
          <RefreshCcw className="w-4 h-4" />
          Làm mới
        </button>
        <button
          onClick={onCreateMaterial}
          className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-purple-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          Create Material
        </button>
      </div>
    </div>
  );
}

export default DashboardWelcomeHeader;