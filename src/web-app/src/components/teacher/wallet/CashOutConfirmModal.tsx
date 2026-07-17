import { ArrowUpRight } from "lucide-react";
import { useTranslation } from "react-i18next";

import ConfirmModal from "../../ui/ConfirmModal";
import { useFormatVnd } from "./types";

interface CashOutConfirmModalProps {
  open: boolean;
  amount: number;
  bankName: string;
  bankAccount: string;
  withdrawalRate: number;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

function CashOutConfirmModal({
  open,
  amount,
  bankName,
  bankAccount,
  withdrawalRate,
  isLoading,
  onClose,
  onConfirm,
}: CashOutConfirmModalProps) {
  const { t } = useTranslation("wallet");
  const formatVnd = useFormatVnd();
  const vnd = amount * withdrawalRate;
  return (
    <ConfirmModal
      open={open}
      onClose={() => !isLoading && onClose()}
      onConfirm={onConfirm}
      title={t("cashOut.modalTitle")}
      icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
      confirmText={t("cashOut.confirmBtn")}
      isLoading={isLoading}
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          {t("cashOut.modalHint")}
        </p>
        <div className="bg-[var(--second-card)] p-4 rounded-2xl space-y-2.5 border border-[var(--border)] text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">
              {t("cashOut.amountCoinsLabel")}
            </span>
            <span className="font-bold text-[var(--foreground)]">
              {formatVnd(amount)} {t("cashOut.coinsUnit")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">
              {t("cashOut.bankNameLabel")}
            </span>
            <span className="font-bold text-[var(--foreground)]">
              {bankName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">
              {t("cashOut.accountInfoLabel")}
            </span>
            <span className="font-bold text-[var(--foreground)] truncate max-w-[200px]">
              {bankAccount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">
              {t("cashOut.rateLabel")}
            </span>
            <span className="font-mono text-amber-300 font-semibold">
              {t("cashOut.rateValue", { rate: formatVnd(withdrawalRate) })}
            </span>
          </div>
          <div className="border-t border-[var(--border)] pt-2 flex justify-between items-center">
            <span className="text-[var(--muted-foreground)] font-semibold">
              {t("cashOut.payoutLabel")}
            </span>
            <span className="text-lg font-black text-green-400">
              {formatVnd(vnd)} VNĐ
            </span>
          </div>
        </div>
      </div>
    </ConfirmModal>
  );
}

export default CashOutConfirmModal;
