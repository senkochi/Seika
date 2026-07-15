import { AlertTriangle } from "lucide-react";

import type { UserAdminResponse } from "../../../api/types";
import ConfirmModal from "../../ui/ConfirmModal";

interface ResetPasswordModalProps {
  open: boolean;
  user: UserAdminResponse | null;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

function ResetPasswordModal({
  open,
  user,
  onClose,
  onConfirm,
  isLoading,
}: ResetPasswordModalProps) {
  return (
    <ConfirmModal
      open={open && user !== null}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Reset mật khẩu"
      confirmText="Xác nhận reset"
      isLoading={isLoading}
      variant="danger"
      icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
    >
      {user && (
        <div className="space-y-2 font-sans-ui">
          <p>
            Reset mật khẩu cho{" "}
            <span className="font-semibold text-cream">{user.username}</span>.
          </p>
          <p>
            Mật khẩu mới sẽ được random và{" "}
            <span className="font-semibold text-red-300">không khả dụng</span>{" "}
            trên hệ thống. User cần liên hệ admin qua kênh khác (email/điện
            thoại) để nhận lại mật khẩu.
          </p>
        </div>
      )}
    </ConfirmModal>
  );
}

export default ResetPasswordModal;