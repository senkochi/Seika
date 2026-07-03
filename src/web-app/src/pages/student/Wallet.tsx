import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  DollarSign,
  Zap,
  Coins,
  CreditCard,
  PlusCircle,
  Sparkles,
  RefreshCcw,
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

function Wallet() {
  const { currentStreak } = useAppSelector((state) => state.userProfile);
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [topUpRate, setTopUpRate] = useState<number>(100);

  // States for Top-Up form
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("VNPay Simulator");
  const [loadingTopUp, setLoadingTopUp] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [balanceRes, historyRes, configsRes] = await Promise.all([
        walletService.getBalance(),
        walletService.getHistory(),
        walletService.getConfigs().catch(() => []),
      ]);

      setBalance(balanceRes.balance || 0);

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
          (c) => c.key === "TOPUP_VND_PER_COIN",
        );
        if (
          rateEntry &&
          !isNaN(Number(rateEntry.value)) &&
          Number(rateEntry.value) > 0
        ) {
          setTopUpRate(Number(rateEntry.value));
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

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVnd = parseInt(topUpAmount, 10);
    if (isNaN(amountVnd) || amountVnd <= 0) {
      showError("Số tiền nạp không hợp lệ!");
      return;
    }
    if (amountVnd < 1000) {
      showError("Số tiền nạp tối thiểu là 1,000 VNĐ!");
      return;
    }

    const calculatedCoins = Math.floor(amountVnd / topUpRate);
    if (calculatedCoins <= 0) {
      showError(
        `Số tiền nạp không đủ để đổi 1 Coin (Tỷ giá: ${topUpRate.toLocaleString("vi-VN")} VNĐ/Coin)!`,
      );
      return;
    }

    setShowConfirmModal(true);
  };

  const executeTopUp = async () => {
    const amountVnd = parseInt(topUpAmount, 10);
    setLoadingTopUp(true);
    try {
      const res = await walletService.topUp({ amountVnd });
      showSuccess(res.message || `Nạp thành công ${res.coinsReceived} Coin!`);
      setTopUpAmount("");
      setShowConfirmModal(false);
      fetchWalletData();
    } catch (err: any) {
      showError(err.response?.data?.message || "Lỗi khi nạp tiền!");
    } finally {
      setLoadingTopUp(false);
    }
  };

  const quickAmounts = [10000, 20000, 50000, 100000];

  const parsedAmount = parseInt(topUpAmount, 10) || 0;
  const estimatedCoins =
    topUpRate > 0 ? Math.floor(parsedAmount / topUpRate) : 0;

  const totalEarned = history
    .filter(
      (t) =>
        t.type === "EARN" ||
        t.type === "REWARD" ||
        t.type === "TOP_UP" ||
        (t.amount > 0 && t.type !== "CASH_OUT"),
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalSpent = history
    .filter(
      (t) =>
        t.type === "WITHDRAW" ||
        t.type === "SPEND" ||
        (t.amount < 0 && t.type !== "TOP_UP"),
    )
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return (
    <div className="p-8">
      {/* Header section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
          <div>
            <h1 className="text-3xl font-black text-[var(--foreground)] mb-2 flex items-center gap-3">
              <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
                Student Wallet
              </span>
              <button
                onClick={fetchWalletData}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
              >
                <RefreshCcw className="h-4 w-4" /> Làm mới
              </button>
            </h1>
            <p className="text-[var(--muted-foreground)]">
              Manage your Coins, check balance and top up to unlock more courses
              & quizzes.
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
                    Top-Up Rate
                  </p>
                  <p className="text-purple-950 font-black">
                    {topUpRate.toLocaleString("vi-VN")} VNĐ / Coin
                  </p>
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
              Total Earned / Top-Up
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

      {/* Transaction History & Top-Up Form Grid */}
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
            <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-2">
              {history.map((tx) => {
                const isEarn =
                  tx.type === "EARN" ||
                  tx.type === "REWARD" ||
                  tx.type === "TOP_UP" ||
                  (tx.amount > 0 && tx.type !== "CASH_OUT");
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-xl hover:bg-[var(--second-muted)] transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        {tx.type === "TOP_UP" && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            TOP-UP
                          </span>
                        )}
                        <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                          {tx.description}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--muted-foreground)] mt-1">
                        {new Date(tx.createdAt).toLocaleString("vi-VN")}
                      </p>
                    </div>
                    <div
                      className={`text-right font-bold text-base shrink-0 ml-2 ${
                        isEarn ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {isEarn ? "+" : "-"}
                      {Math.abs(tx.amount).toLocaleString()} Coins
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top-Up Form (Simulator) */}
        <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 h-fit shadow-lg shadow-black/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Top-Up Coin
            </h2>
            <span className="text-xs px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> MVP Demo
            </span>
          </div>

          <form onSubmit={handleTopUp} className="space-y-5">
            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                Amount to Top-Up (VNĐ)
              </label>
              <div className="relative">
                <CreditCard className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" />
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  placeholder="e.g. 20,000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] font-mono text-base focus:outline-none focus:border-[var(--ring)]"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt.toString())}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      topUpAmount === amt.toString()
                        ? "bg-amber-400/20 border-amber-400 text-amber-300"
                        : "bg-[var(--second-card)] border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--muted-foreground)]"
                    }`}
                  >
                    {amt.toLocaleString("vi-VN")} đ
                  </button>
                ))}
              </div>
            </div>

            {/* Conversion Display Box */}
            <div className="p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                  <Coins className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    You will receive
                  </p>
                  <p className="text-lg font-black text-[var(--foreground)]">
                    {estimatedCoins.toLocaleString()}{" "}
                    <span className="text-sm font-semibold text-amber-400">
                      Coin
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[var(--muted-foreground)]">
                  Exchange Rate
                </p>
                <p className="text-xs font-mono font-bold text-[var(--foreground)]">
                  {topUpRate.toLocaleString("vi-VN")} đ/Coin
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--muted-foreground)] mb-2">
                Payment Simulator Partner
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 bg-[rgba(255,255,255,0.06)] border border-[var(--border)] rounded-xl text-[var(--foreground)] focus:outline-none focus:border-[var(--ring)]"
              >
                <option
                  value="VNPay Simulator"
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  VNPay (Demo Instant)
                </option>
                <option
                  value="Momo Simulator"
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  Momo Wallet (Demo Instant)
                </option>
                <option
                  value="Bank Transfer Demo"
                  className="bg-[var(--card)] text-[var(--foreground)]"
                >
                  Bank Transfer (Demo Instant)
                </option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loadingTopUp || parsedAmount < 1000}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                {loadingTopUp ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <PlusCircle className="w-5 h-5" />
                )}
                Confirm Top-Up (Demo)
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirmModal}
        onClose={() => !loadingTopUp && setShowConfirmModal(false)}
        onConfirm={executeTopUp}
        title="Xác nhận Nạp Tiền (Demo Simulator)"
        icon={<PlusCircle className="w-5 h-5 text-amber-400" />}
        confirmText="Xác nhận nạp"
        isLoading={loadingTopUp}
      >
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted-foreground)]">
            Vui lòng kiểm tra lại thông tin giao dịch nạp Coin bên dưới:
          </p>
          <div className="bg-[var(--second-card)] p-4 rounded-2xl space-y-2.5 border border-[var(--border)] text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Số tiền thanh toán:
              </span>
              <span className="font-bold text-[var(--foreground)]">
                {parsedAmount.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Phương thức:
              </span>
              <span className="font-bold text-[var(--foreground)]">
                {paymentMethod}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-foreground)]">
                Tỷ giá quy đổi:
              </span>
              <span className="font-mono text-amber-300 font-semibold">
                {topUpRate.toLocaleString("vi-VN")} VNĐ / Coin
              </span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between items-center">
              <span className="text-[var(--muted-foreground)] font-semibold">
                Bạn sẽ nhận ngay:
              </span>
              <span className="text-lg font-black text-green-400">
                +{estimatedCoins.toLocaleString()} Coin
              </span>
            </div>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

export default Wallet;
