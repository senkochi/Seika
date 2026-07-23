import { PageHeader } from "../../ui/PageHeader";
import { Button } from "../../ui/Button";
import { RefreshCcw } from "lucide-react";

interface WelcomeHeaderProps {
  displayName: string;
  onRefresh: () => void;
}

function WelcomeHeader({ displayName, onRefresh }: WelcomeHeaderProps) {
  return (
    <PageHeader
      title={`Chào, ${displayName}`}
      subtitle="Đây là tổng quan tiến trình học tập hôm nay của bạn."
      actions={
        <Button variant="ghost" size="md" onClick={onRefresh}>
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          Làm mới
        </Button>
      }
    />
  );
}

export default WelcomeHeader;