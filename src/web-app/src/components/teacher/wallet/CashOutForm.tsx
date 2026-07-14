import { useState } from "react";
import { ArrowUpRight, Coins, Loader2 } from "lucide-react";

import { showError } from "../../toast/toastUtils";

interface CashOutFormProps {
  withdrawableBalance: number;
  onSubmit: (data: {
    amount: number;
    bankName: string;
    bankAccount: string;
  }) => void;
}

function CashOutForm({ withdrawableBalance, onSubmit }: CashOutFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("Vietcombank");
  const [bankAccount, setBankAccount] = useState<string>(
    "1029312093 - NGUYEN VAN A",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) {
      showError("Amount is invalid.");
      return;
    }
    if (parsed % 10 !== 0) {
      showError("Cash-out amount must be a multiple of 10 coins.");
      return;
    }
    if (parsed > withdrawableBalance) {
      showError("Withdrawable balance is not enough.");
      return;
    }
    onSubmit({ amount: parsed, bankName, bankAccount });
  };

  return (
    <div className="lg:col-span-2 h-fit rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-xl">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
        <ArrowUpRight className="h-5 w-5 text-amber-400" />
        Request Cash Out
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
          Available to cash out:{" "}
          <span className="font-mono font-bold text-[var(--foreground)]">
            {withdrawableBalance.toLocaleString("vi-VN")}
          </span>{" "}
          Coins
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--muted-foreground)]">
            Amount of Coins to Withdraw
          </label>
          <div className="relative">
            <Coins className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="number"
              required
              min={10}
              placeholder="Min 10 Coins"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] py-3 pl-10 pr-4 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--muted-foreground)]">
            Bank / Payment Partner
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
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
          <label className="mb-2 block text-sm text-[var(--muted-foreground)]">
            Account Number & Full Name
          </label>
          <input
            type="text"
            required
            placeholder="e.g. 1029312093 - NGUYEN VAN A"
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-black text-purple-950 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Loader2 className="hidden h-4 w-4 animate-spin" />
            Confirm Cash Out
          </button>
        </div>
      </form>
    </div>
  );
}

export default CashOutForm;
