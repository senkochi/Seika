import { useState } from "react";
import { ArrowUpRight, Coins, Loader2 } from "lucide-react";

import { showError } from "../../toast/toastUtils";

interface CashOutFormProps {
  balance: number;
  onSubmit: (data: { amount: number; bankName: string; bankAccount: string }) => void;
}

function CashOutForm({ balance, onSubmit }: CashOutFormProps) {
  const [amount, setAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("Vietcombank");
  const [bankAccount, setBankAccount] = useState<string>(
    "1029312093 - NGUYEN VAN A",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) {
      showError("Số lượng không hợp lệ!");
      return;
    }
    if (parsed % 10 !== 0) {
      showError("Số coin rút phải là bội số của 10!");
      return;
    }
    if (parsed > balance) {
      showError("Số dư không đủ!");
      return;
    }
    onSubmit({ amount: parsed, bankName, bankAccount });
  };

  return (
    <div className="lg:col-span-2 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6 h-fit shadow-lg shadow-black/20">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
        <ArrowUpRight className="w-5 h-5 text-amber-400" />
        Request Cash Out
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
            <option value="Vietcombank" className="bg-[var(--card)] text-[var(--foreground)]">Vietcombank</option>
            <option value="Techcombank" className="bg-[var(--card)] text-[var(--foreground)]">Techcombank</option>
            <option value="MB Bank" className="bg-[var(--card)] text-[var(--foreground)]">MB Bank</option>
            <option value="Momo Wallet" className="bg-[var(--card)] text-[var(--foreground)]">Momo Wallet</option>
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
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin hidden" />
            Confirm Cash Out
          </button>
        </div>
      </form>
    </div>
  );
}

export default CashOutForm;