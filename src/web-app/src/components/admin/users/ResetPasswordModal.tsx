import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("admin");
  return (
    <ConfirmModal
      open={open && user !== null}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t("users.resetModal.title")}
      confirmText={t("users.resetModal.confirm")}
      isLoading={isLoading}
      variant="danger"
      icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
    >
      {user && (
        <div className="space-y-2 font-sans-ui">
          <p>{t("users.resetModal.info", { username: user.username })}</p>
          <p>{t("users.resetModal.detail")}</p>
        </div>
      )}
    </ConfirmModal>
  );
}

export default ResetPasswordModal;
