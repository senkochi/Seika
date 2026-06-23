import { useEffect, useState } from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Loader2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { walletService } from "../../api";
import { showSuccess, showError } from "../../components/toast/toastUtils";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

function TeacherWallet() {
  const [balance, setBalance] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Form rút tiền
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("Vietcombank");
  const [loadingWithdraw, setLoadingWithdraw] = useState(false);

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
        // Fallback mockup nếu chưa có lịch sử
        setHistory([
          {
            id: "1",
            amount: 150,
            type: "EARN",
            description: "Marketplace sale: Basic React Native",
            createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
          },
          {
            id: "2",
            amount: 250,
            type: "EARN",
            description: "Marketplace sale: English IELTS Vocabulary",
            createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
          },
          {
            id: "3",
            amount: 2000,
            type: "WITHDRAW",
            description: "Cash out to Vietcombank: 9021301293",
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      showError("Could not retrieve wallet details. Showing offline data.");
      // Fallback offline data
      setBalance(3450);
      setHistory([
        {
          id: "1",
          amount: 150,
          type: "EARN",
          description: "Marketplace sale: Basic React Native",
          createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        },
        {
          id: "2",
          amount: 250,
          type: "EARN",
          description: "Marketplace sale: English IELTS Vocabulary",
          createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
        },
        {
          id: "3",
          amount: 2000,
          type: "WITHDRAW",
          description: "Cash out request: 2,000 Coins",
          createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return showError("Please enter a valid amount.");
    }
    if (amount > balance) {
      return showError("Insufficient balance.");
    }
    if (!bankAccount.trim()) {
      return showError("Please enter your bank account details.");
    }

    setLoadingWithdraw(true);
    try {
      const description = `Cash out to ${bankName} A/C: ${bankAccount}`;
      await walletService.withdraw({
        amount: amount,
        description: description,
      });
      showSuccess(`Cash out request of ${amount} Coins sent successfully!`);
      setWithdrawAmount("");
      setBankAccount("");
      fetchWalletData(); // Cập nhật lại số dư và lịch sử
    } catch (err) {
      console.error(err);
      showError("Failed to submit withdraw request.");
    } finally {
      setLoadingWithdraw(false);
    }
  };

  // Tính toán nhanh
  const totalEarned = history
    .filter((t) => t.type === "EARN" || t.type === "REWARD")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalWithdrawn = history
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
              Manage your earnings, check balances and request Cash Out to your
              bank account.
            </p>
          </div>

          {/* Balance card */}
          <div className="relative group w-full md:w-[28rem] lg:w-[32rem]">
            <div className="relative w-full bg-gradient-to-b from-amber-400 to-yellow-500 rounded-3xl p-1 shadow-2xl">
              <div className="rounded-[22px] bg-slate-950/80 backdrop-blur-md px-8 py-6">
                <div>
                  <p className="text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
                    Your Coin Balance
                  </p>
                  <div className="flex items-center gap-2">
                    <Coins className="w-8 h-8 text-yellow-400" />
                    <p className="text-[var(--foreground)] text-4xl font-black">
                      {loading ? "..." : balance.toLocaleString()}
                    </p>
                    <span className="text-yellow-400/90 text-sm font-semibold mt-2">
                      Coins
                    </span>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                  <span>Conversion: 1,000 Coins = 10,000 VND</span>
                  <span>Estimated: {(balance * 10).toLocaleString()} VND</span>
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
              Total Revenue Earned
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
              Total Cash Out
            </p>
            <p className="text-xl font-bold text-[var(--foreground)]">
              -{totalWithdrawn.toLocaleString()} Coins
            </p>
          </div>
        </div>

        <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex items-center gap-4 hover:border-[var(--primary)] transition-all">
          <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <Briefcase className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-[var(--muted-foreground)] text-sm">
              Earnings Status
            </p>
            <p className="text-xl font-bold text-[var(--foreground)]">
              Verified Partner
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Cash Out Form & Transaction History */}
      <div className="grid lg:grid-cols-5 gap-8">
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
                <option value="Vietcombank" className="bg-[var(--card)]">
                  Vietcombank
                </option>
                <option value="Techcombank" className="bg-[var(--card)]">
                  Techcombank
                </option>
                <option value="MB Bank" className="bg-[var(--card)]">
                  MB Bank
                </option>
                <option value="Momo Wallet" className="bg-[var(--card)]">
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
                      tx.amount > 0
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
    </div>
  );
}

export default TeacherWallet;
