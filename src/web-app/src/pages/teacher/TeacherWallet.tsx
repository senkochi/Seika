import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
  Zap,
  ArrowUpRight,
  Coins,
} from "lucide-react";
import { walletService } from "../../api";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import { useAppSelector } from "../../store/hooks";
import ConfirmModal from "../../components/ui/ConfirmModal";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

function TeacherWallet() {
  const { currentStreak } = useAppSelector((state) => state.userProfile);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [withdrawalRate, setWithdrawalRate] = useState<number>(90);

  // States for Cash Out form
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("Vietcombank");
  const [bankAccount, setBankAccount] = useState<string>(
    "1029312093 - NGUYEN VAN A",
  );
  const [loadingWithdraw, setLoadingWithdraw] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      // Gọi song song lấy balance, lịch sử giao dịch và cấu hình tỷ giá
      const [balanceRes, historyRes, configsRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getHistory(),
        walletService.getConfigs().catch(() => []),
      ]);

      setBalance(balanceRes.balance || 0);

      // Xử lý dữ liệu history trả về từ API
      if (Array.isArray(historyRes)) {
        const sorted = [...historyRes].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setHistory(sorted);
      } else if (historyRes && Array.isArray((historyRes as any).data)) {
        const sorted = [...(historyRes as any).data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setHistory(sorted);
      } else {
        setHistory([]);
      }

      if (Array.isArray(configsRes)) {
        const rateEntry = configsRes.find(
          (c) => c.key === "WITHDRAWAL_VND_PER_COIN",
        );
        if (rateEntry && !isNaN(Number(rateEntry.value))) {
          setWithdrawalRate(Number(rateEntry.value));
        }
      }
    } catch (err) {
      console.error(err);
      showError("Could not retrieve wallet details.");
      setBalance(0);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(withdrawAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      showError("Số lượng không hợp lệ!");
      return;
    }
    if (amount % 10 !== 0) {
      showError("Số coin rút phải là bội số của 10!");
      return;
    }
    if (amount > balance) {
      showError("Số dư không đủ!");
      return;
    }
    setShowConfirmModal(true);
  };

  const executeWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    const vnd = amount * withdrawalRate;
    setLoadingWithdraw(true);
    try {
      const description = `Quy đổi: ${amount} Coins = ${vnd.toLocaleString("vi-VN")} VNĐ (${bankName} - ${bankAccount})`;
      await walletService.cashOut({ amount, description });
      showSuccess("Rút tiền thành công!");
      setWithdrawAmount("");
      setShowConfirmModal(false);
      fetchWalletData();
    } catch (err: any) {
      showError(err.response?.data?.message || "Lỗi khi rút tiền!");
    } finally {
      setLoadingWithdraw(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Tính toán nhanh
  const totalEarned = history
    .filter((t) => t.type === "EARN" || t.type === "REWARD")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSpent = history
    .filter((t) => t.type === "WITHDRAW" || t.type === "SPEND")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="p-8">
      {/* Header section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-[var(--foreground)] mb-2">
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Teacher Wallet
              </span>
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Manage your earnings, check balances and spent coins.
            </p>
          </div>

          {/* Balance card */}
          <div className="relative group w-full md:w-[30rem] lg:w-[34rem] md:ml-auto">
            <div className="relative w-full bg-gradient-to-b from-amber-400 to-yellow-500 rounded-3xl p-1 shadow-2xl">
              <div className="rounded-[22px] px-8 py-6">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-white text-sm font-black uppercase tracking-wider mb-1">
                      Your Balance
                    </p>
                    <p className="text-purple-950 text-4xl font-black">
                      {loading ? "..." : balance.toLocaleString()}
                    </p>
                    <p className="text-purple-900/90 text-sm font-semibold">
                      Coin
                    </p>
                  </div>
                </div>
                <div className="text-right w-full mt-4">
                  <p className="text-white/85 text-xs font-semibold">
                    Earned Today
                  </p>
                  <p className="text-purple-950 font-black">+0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick stats grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex items-center gap-4 hover:border-[var(--primary)] transition-all">
          <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20">
            <TrendingUp className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <p className="text-[var(--muted-foreground)] text-sm">
              Total Earned
            </p>
            <p className="text-xl font-bold text-[var(--foreground)]">
              +{totalEarned.toLocaleString()} Coins
            </p>
          </div>
        </div>

        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex items-center gap-4 hover:border-[var(--primary)] transition-all">
          <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
            <TrendingDown className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <p className="text-[var(--muted-foreground)] text-sm">
              Total Spent
            </p>
            <p className="text-xl font-bold text-[var(--foreground)]">
              -{totalSpent.toLocaleString()} Coins
            </p>
          </div>
        </div>

        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex items-center gap-4 hover:border-[var(--primary)] transition-all">
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-[var(--muted-foreground)] text-sm">
              Active Streak
            </p>
            <p className="text-xl font-bold text-[var(--foreground)]">
              {currentStreak ?? 0} Days
            </p>
          </div>
        </div>
      </div>

      {/* Transaction History & Cash Out Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-3 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-lg shadow-black/20">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />
            Transaction History
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)] gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
              <p className="text-sm">Loading transactions...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 text-[var(--muted-foreground)]">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-2">
              {history.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-xl hover:bg-[var(--second-muted)] transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      {tx.description}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {new Date(tx.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <div
                    className={`text-right font-bold text-base shrink-0 ml-4 ${
                      tx.type === "EARN" ||
                      tx.type === "REWARD" ||
                      (tx.amount > 0 && tx.type !== "CASH_OUT")
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {tx.type === "EARN" ||
                    tx.type === "REWARD" ||
                    (tx.amount > 0 && tx.type !== "CASH_OUT")
                      ? "+"
                      : "-"}
                    {Math.abs(tx.amount).toLocaleString()} Coins
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cash Out Form */}
        <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 h-fit shadow-lg shadow-black/20">
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-amber-400" />
            Request Cash Out
          </h2>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                Amount of Coins to Withdraw
              </label>
              <div className="relative">
                <Coins className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="number"
                  required
                  min={100}
                  placeholder="Min 100 Coins"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                Bank / Payment Partner
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
              >
                <option
                  value="Vietcombank"
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  Vietcombank
                </option>
                <option
                  value="Techcombank"
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  Techcombank
                </option>
                <option
                  value="MB Bank"
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  MB Bank
                </option>
                <option
                  value="Momo Wallet"
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  Momo Wallet
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                Account Number & Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 1029312093 - NGUYEN VAN A"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingWithdraw}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loadingWithdraw && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Confirm Cash Out
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirmModal}
        onClose={() => !loadingWithdraw && setShowConfirmModal(false)}
        onConfirm={executeWithdraw}
        title="Xác nhận Rút Tiền (Cash Out)"
        icon={<ArrowUpRight className="w-5 h-5 text-amber-400" />}
        confirmText="Xác nhận rút"
        isLoading={loadingWithdraw}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Vui lòng kiểm tra lại thông tin yêu cầu rút Coin bên dưới:
          </p>
          <div className="bg-[var(--second-card)] p-4 rounded-2xl space-y-2.5 border border-[var(--border)] text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Số coin rút:
              </span>
              <span className="font-bold text-[var(--foreground)]">
                {(parseInt(withdrawAmount, 10) || 0).toLocaleString()} Coin
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Ngân hàng / Đối tác:
              </span>
              <span className="font-bold text-[var(--foreground)]">
                {bankName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Tài khoản nhận:
              </span>
              <span className="font-bold text-[var(--foreground)] truncate max-w-[200px]">
                {bankAccount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Tỷ giá quy đổi:
              </span>
              <span className="font-mono text-amber-300 font-semibold">
                {withdrawalRate.toLocaleString("vi-VN")} VNĐ / Coin
              </span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between items-center">
              <span className="text-[var(--muted-foreground)] font-semibold">
                Thực nhận dự kiến:
              </span>
              <span className="text-lg font-black text-green-400">
                {(
                  (parseInt(withdrawAmount, 10) || 0) * withdrawalRate
                ).toLocaleString("vi-VN")}{" "}
                VNĐ
              </span>
            </div>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

export default TeacherWallet;
