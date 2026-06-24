import { useEffect, useState } from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  DollarSign,
  Zap,
} from "lucide-react";
import { walletService } from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";
import { useAppSelector } from "../../store/hooks";

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

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      // Gọi song song lấy balance và lịch sử giao dịch
      const balanceRes = await walletService.getBalance();
      setBalance(balanceRes.balance || 0);

      const historyRes = await walletService.getHistory();
      // Xử lý dữ liệu history trả về từ API
      if (Array.isArray(historyRes)) {
        setHistory(historyRes);
      } else if (historyRes && Array.isArray(historyRes.data)) {
        setHistory(historyRes.data);
      } else {
        setHistory([]);
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
                <div className="text-right w-full">
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

      {/* Transaction History */}
      <div className="gap-8 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 shadow-lg shadow-black/20">
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
                    tx.type === "EARN" || tx.type === "REWARD" || tx.amount > 0
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {tx.type === "EARN" || tx.type === "REWARD" || tx.amount > 0
                    ? "+"
                    : "-"}
                  {Math.abs(tx.amount).toLocaleString()} Coins
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TeacherWallet;
