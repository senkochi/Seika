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
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="md"
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2"
        >
          <RefreshCcw className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Làm mới</span>
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onCreateMaterial}
          className="inline-flex items-center justify-center gap-2"
        >
          <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Tạo nội dung mới</span>
        </Button>
      </div>
    </div>
  );
}

export default DashboardWelcomeHeader;
