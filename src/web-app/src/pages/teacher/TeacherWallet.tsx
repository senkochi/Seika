import { useEffect, useState } from "react";

import { useAppSelector } from "../../store/hooks";
import { walletService } from "../../api";
import {
  marketplaceApi,
  type EscrowTransaction,
} from "../../api/services/marketplace";
import { showError, showSuccess } from "../../components/toast/toastUtils";

import TeacherWalletHeader from "../../components/teacher/wallet/TeacherWalletHeader";
import WalletStatsGrid from "../../components/teacher/wallet/WalletStatsGrid";
import TransactionHistory from "../../components/teacher/wallet/TransactionHistory";
import CashOutForm from "../../components/teacher/wallet/CashOutForm";
import CashOutConfirmModal from "../../components/teacher/wallet/CashOutConfirmModal";
import SellerEscrowPanel from "../../components/teacher/wallet/SellerEscrowPanel";
import { useWalletData } from "../../components/teacher/wallet/useWalletData";

interface PendingCashOut {
  amount: number;
  bankName: string;
  bankAccount: string;
}

function TeacherWallet() {
  const { currentStreak } = useAppSelector((state) => state.userProfile);
  const streak = currentStreak ?? 0;
  const wallet = useWalletData();

  const [pending, setPending] = useState<PendingCashOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [escrows, setEscrows] = useState<EscrowTransaction[]>([]);
  const [escrowsLoading, setEscrowsLoading] = useState(false);

  const loadEscrows = async () => {
    setEscrowsLoading(true);
    try {
      const response = await marketplaceApi.getSellerEscrows();
      const rows = Array.isArray(response.data) ? response.data : [];
      setEscrows(
        [...rows].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
    } catch (err) {
      console.error(err);
      setEscrows([]);
    } finally {
      setEscrowsLoading(false);
    }
  };

  useEffect(() => {
    void loadEscrows();
  }, []);

  const reloadAll = async () => {
    await Promise.all([wallet.reload(), loadEscrows()]);
  };

  const handleWithdraw = async () => {
    if (!pending) return;
    const vnd = pending.amount * wallet.withdrawalRate;
    const description = `Quy đổi: ${pending.amount} Coins = ${vnd.toLocaleString("vi-VN")} VNĐ (${pending.bankName} - ${pending.bankAccount})`;
    setLoading(true);
    try {
      await walletService.cashOut({ amount: pending.amount, description });
      showSuccess("Rút tiền thành công!");
      setPending(null);
      void reloadAll();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showError(e.response?.data?.message ?? "Lỗi khi rút tiền!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <TeacherWalletHeader
        balance={wallet.balance}
        withdrawableBalance={wallet.withdrawableBalance}
        appOnlyBalance={wallet.appOnlyBalance}
        loading={wallet.loading || escrowsLoading}
        onReload={reloadAll}
      />

      <WalletStatsGrid
        totalEarned={wallet.totalEarned}
        totalSpent={wallet.totalSpent}
        currentStreak={streak}
      />

      <div className="mb-8">
        <SellerEscrowPanel escrows={escrows} loading={escrowsLoading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <TransactionHistory history={wallet.history} loading={wallet.loading} />

        <CashOutForm
          withdrawableBalance={wallet.withdrawableBalance}
          onSubmit={(p) => setPending(p)}
        />
      </div>

      <CashOutConfirmModal
        open={pending !== null}
        amount={pending?.amount ?? 0}
        bankName={pending?.bankName ?? ""}
        bankAccount={pending?.bankAccount ?? ""}
        withdrawalRate={wallet.withdrawalRate}
        isLoading={loading}
        onClose={() => setPending(null)}
        onConfirm={handleWithdraw}
      />
    </div>
  );
}

export default TeacherWallet;
