import { PlusCircle, RefreshCcw } from "lucide-react";
import { Button } from "../../ui/Button";

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
    <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div>
        <h1 className="font-sans-ui text-2xl font-semibold tracking-tight text-cream">
          Chào, {displayName}
        </h1>
        <p className="mt-1 font-sans-ui text-sm text-white/55">
          Tổng quan giảng dạy và thu nhập Marketplace của bạn hôm nay.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" size="md" onClick={onRefresh}>
          <RefreshCcw className="w-4 h-4" aria-hidden="true" />
          Làm mới
        </Button>
        <Button variant="primary" size="md" onClick={onCreateMaterial}>
          <PlusCircle className="w-4 h-4" aria-hidden="true" />
          Tạo nội dung mới
        </Button>
      </div>
    </div>
  );
}

export default DashboardWelcomeHeader;