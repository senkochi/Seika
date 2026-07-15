import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Zap,
  Coins,
  CreditCard,
  PlusCircle,
  RefreshCcw,
} from "lucide-react";
import { walletService } from "../../api";
import { showError, showSuccess } from "../../components/toast/toastUtils";
import { useAppSelector } from "../../store/hooks";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { StatCard } from "../../components/ui/StatCard";
import { IconChip } from "../../components/ui/IconChip";
import { StatusPill } from "../../components/ui/StatusPill";
import { EmptyState } from "../../components/ui/EmptyState";
import { Button } from "../../components/ui/Button";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString("vi-VN");
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
    <div className="space-y-8 p-6 lg:p-8">
      <PageHeader
        title="Ví của tôi"
        subtitle="Quản lý Coin, kiểm tra số dư và nạp thêm để mở khóa khóa học & quiz."
        actions={
          <Button
            variant="ghost"
            size="md"
            onClick={fetchWalletData}
            disabled={loading}
          >
            <RefreshCcw
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              aria-hidden="true"
            />{" "}
            Làm mới
          </Button>
        }
      />

      {/* Balance card with gold left-accent */}
      <SectionCard className="relative overflow-hidden">
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-px bg-[#d4a843]/60"
        />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
              Số dư hiện tại
            </p>
            <p className="mt-3 font-sans-ui text-4xl font-semibold text-cream tabular-nums">
              {loading ? "…" : balance.toLocaleString("vi-VN")}
              <span className="ml-2 text-base font-medium text-[#d4a843]">
                Coins
              </span>
            </p>
            <div className="mt-3 flex items-center gap-2">
              <StatusPill variant="gold">Đang hoạt động</StatusPill>
              <span className="font-sans-ui text-xs text-white/55">
                {topUpRate.toLocaleString("vi-VN")} VNĐ / Coin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="md">
              <Coins className="w-4 h-4" aria-hidden="true" /> Rút Coin
            </Button>
            <Button variant="primary" size="md">
              <PlusCircle className="w-4 h-4" aria-hidden="true" /> Nạp Coin
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Quick stats grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Tổng thu nhập / Nạp"
          value={`+${totalEarned.toLocaleString("vi-VN")}`}
          unit="Coins"
          icon={<TrendingUp className="w-4 h-4" aria-hidden="true" />}
          iconVariant="success"
        />
        <StatCard
          label="Tổng chi tiêu"
          value={`-${totalSpent.toLocaleString("vi-VN")}`}
          unit="Coins"
          icon={<TrendingDown className="w-4 h-4" aria-hidden="true" />}
          iconVariant="danger"
        />
        <StatCard
          label="Chuỗi ngày học"
          value={`${currentStreak ?? 0}`}
          unit="ngày"
          icon={<Zap className="w-4 h-4" aria-hidden="true" />}
          iconVariant="warning"
        />
      </div>

      {/* Transaction History & Top-Up Form Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
        {/* Transaction History */}
        <SectionCard className="lg:col-span-3">
          <h2 className="font-sans-ui text-base font-semibold text-cream flex items-center gap-2 mb-5">
            <IconChip variant="muted" className="h-8 w-8">
              <Coins className="w-4 h-4" aria-hidden="true" />
            </IconChip>
            Lịch sử giao dịch
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-white/55 gap-2 font-sans-ui">
              <Loader2 className="w-8 h-8 animate-spin text-[#d4a843]" aria-hidden="true" />
              <p className="text-sm">Đang tải giao dịch…</p>
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={<Coins className="w-5 h-5" aria-hidden="true" />}
              title="Chưa có giao dịch nào"
              description="Lịch sử nạp, rút và thưởng Coin của bạn sẽ hiển thị tại đây."
            />
          ) : (
            <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-2 custom-scrollbar">
              {history.map((tx) => {
                const isEarn =
                  tx.type === "EARN" ||
                  tx.type === "REWARD" ||
                  tx.type === "TOP_UP" ||
                  (tx.amount > 0 && tx.type !== "CASH_OUT");
                const pillColor =
                  tx.type === "TOP_UP"
                    ? "warning"
                    : isEarn
                      ? "success"
                      : "danger";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2">
                        <StatusPill variant={pillColor}>{tx.type}</StatusPill>
                        <p className="text-sm font-sans-ui text-cream truncate">
                          {tx.description}
                        </p>
                      </div>
                      <p className="font-sans-ui text-xs text-white/55 mt-1">
                        {formatDate(tx.createdAt)}
                      </p>
                    </div>
                    <div
                      className={`text-right font-sans-ui font-semibold text-base shrink-0 ml-2 tabular-nums ${
                        isEarn ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {isEarn ? "+" : "-"}
                      {Math.abs(tx.amount).toLocaleString("vi-VN")} Coins
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* Top-Up Form (Simulator) */}
        <SectionCard className="lg:col-span-2 h-fit">
          <h2 className="font-sans-ui text-base font-semibold text-cream flex items-center gap-2 mb-5">
            <PlusCircle className="w-4 h-4 text-[#d4a843]" aria-hidden="true" />
            Nạp Coin
          </h2>

          <form onSubmit={handleTopUp} className="space-y-5">
            <div>
              <label className="block font-sans-ui text-sm text-white/55 mb-2">
                Số tiền cần nạp (VNĐ)
              </label>
              <div className="relative">
                <CreditCard
                  className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/45"
                  aria-hidden="true"
                />
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  placeholder="vd. 20,000"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-cream font-mono text-base focus:outline-none focus:border-[#d4a843]/50 transition-colors placeholder:text-white/35"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                {quickAmounts.map((amt) => {
                  const active = topUpAmount === amt.toString();
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt.toString())}
                      aria-pressed={active}
                      className={
                        active
                          ? "py-2 px-3 rounded-xl text-xs font-sans-ui font-medium border border-[#d4a843]/30 bg-[#d4a843]/10 text-[#d4a843] transition-colors"
                          : "py-2 px-3 rounded-xl text-xs font-sans-ui font-medium border border-white/[0.08] bg-white/[0.02] text-white/55 hover:text-cream transition-colors"
                      }
                    >
                      {amt.toLocaleString("vi-VN")} đ
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversion Display Box */}
            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconChip variant="gold">
                  <Coins className="w-4 h-4" aria-hidden="true" />
                </IconChip>
                <div>
                  <p className="font-sans-ui text-xs text-white/55">
                    Bạn sẽ nhận
                  </p>
                  <p className="font-sans-ui text-lg font-semibold text-cream tabular-nums">
                    {estimatedCoins.toLocaleString("vi-VN")}{" "}
                    <span className="text-sm font-medium text-[#d4a843]">
                      Coin
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-sans-ui text-[11px] text-white/55">
                  Tỷ giá
                </p>
                <p className="font-sans-ui text-xs font-mono font-medium text-cream">
                  {topUpRate.toLocaleString("vi-VN")} đ/Coin
                </p>
              </div>
            </div>

            <div>
              <label className="block font-sans-ui text-sm text-white/55 mb-2">
                Phương thức thanh toán (Demo)
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-cream focus:outline-none focus:border-[#d4a843]/50 transition-colors"
              >
                <option value="VNPay Simulator">VNPay (Demo)</option>
                <option value="Momo Simulator">Momo Wallet (Demo)</option>
                <option value="Bank Transfer Demo">Bank Transfer (Demo)</option>
              </select>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={loadingTopUp || parsedAmount < 1000}
              >
                {loadingTopUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                )}
                Xác nhận nạp (Demo)
              </Button>
            </div>
          </form>
        </SectionCard>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        open={showConfirmModal}
        onClose={() => !loadingTopUp && setShowConfirmModal(false)}
        onConfirm={executeTopUp}
        title="Xác nhận Nạp Coin (Demo)"
        icon={<PlusCircle className="w-5 h-5 text-[#d4a843]" />}
        confirmText="Xác nhận nạp"
        isLoading={loadingTopUp}
      >
        <div className="space-y-3 font-sans-ui">
          <p className="text-sm text-white/55">
            Vui lòng kiểm tra lại thông tin giao dịch nạp Coin bên dưới:
          </p>
          <div className="bg-white/[0.02] p-4 rounded-xl space-y-2.5 border border-white/[0.06] text-sm">
            <div className="flex justify-between">
              <span className="text-white/55">Số tiền thanh toán:</span>
              <span className="font-semibold text-cream tabular-nums">
                {parsedAmount.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">Phương thức:</span>
              <span className="font-semibold text-cream">{paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/55">Tỷ giá quy đổi:</span>
              <span className="font-mono text-[#d4a843] font-semibold">
                {topUpRate.toLocaleString("vi-VN")} VNĐ / Coin
              </span>
            </div>
            <div className="border-t border-white/[0.06] pt-2 flex justify-between items-center">
              <span className="text-white/55 font-semibold">
                Bạn sẽ nhận ngay:
              </span>
              <span className="text-lg font-semibold text-emerald-300 tabular-nums">
                +{estimatedCoins.toLocaleString("vi-VN")} Coin
              </span>
            </div>
          </div>
        </div>
      </ConfirmModal>
    </div>
  );
}

export default Wallet;