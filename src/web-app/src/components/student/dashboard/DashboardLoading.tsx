import { Loader2 } from "lucide-react";

function DashboardLoading() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[60dvh] font-sans-ui">
      <div className="flex flex-col items-center gap-4 text-white/55">
        <Loader2
          className="w-10 h-10 animate-spin text-[#d4a843]"
          aria-hidden="true"
        />
        <p>Đang tải dashboard...</p>
      </div>
    </div>
  );
}

export default DashboardLoading;