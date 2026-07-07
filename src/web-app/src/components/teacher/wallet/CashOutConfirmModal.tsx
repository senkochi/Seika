import { ArrowUpRight } from "lucide-react";

import ConfirmModal from "../../ui/ConfirmModal";
import { formatVnd } from "./types";

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
  const vnd = amount * withdrawalRate;
  return (
    <ConfirmModal
      open={open}
      onClose={() => !isLoading && onClose()}
      onConfirm={onConfirm}
      title="Xác nhận Rút Tiền (Cash Out)"
      icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
      confirmText="Xác nhận rút"
      isLoading={isLoading}
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--muted-foreground)]">
          Vui lòng kiểm tra lại thông tin yêu cầu rút Coin bên dưới:
        </p>
        <div className="bg-[var(--second-card)] p-4 rounded-2xl space-y-2.5 border border-[var(--border)] text-sm">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Số coin rút:</span>
            <span className="font-bold text-[var(--foreground)]">
              {formatVnd(amount)} Coin
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Ngân hàng / Đối tác:</span>
            <span className="font-bold text-[var(--foreground)]">{bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Tài khoản nhận:</span>
            <span className="font-bold text-[var(--foreground)] truncate max-w-[200px]">
              {bankAccount}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Tỷ giá quy đổi:</span>
            <span className="font-mono text-amber-300 font-semibold">
              {formatVnd(withdrawalRate)} VNĐ / Coin
            </span>
          </div>
          <div className="border-t border-[var(--border)] pt-2 flex justify-between items-center">
            <span className="text-[var(--muted-foreground)] font-semibold">Thực nhận dự kiến:</span>
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