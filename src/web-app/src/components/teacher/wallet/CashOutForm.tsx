import { useState } from "react";
import { ArrowUpRight, Coins, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { showError } from "../../toast/toastUtils";
import { useFormatNumber } from "../../../utils/format";

interface CashOutFormProps {
  withdrawableBalance: number;
  onSubmit: (data: {
    amount: number;
    bankName: string;
    bankAccount: string;
  }) => void;
  disabledReason?: string;
}

function CashOutForm({
  withdrawableBalance,
  onSubmit,
  disabledReason,
}: CashOutFormProps) {
  const { t } = useTranslation("wallet");
  const formatNumber = useFormatNumber();
  const [amount, setAmount] = useState<string>("");
  const [bankName, setBankName] = useState<string>("Vietcombank");
  const [bankAccount, setBankAccount] = useState<string>(
    "1029312093 - NGUYEN VAN A",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabledReason) {
      showError(disabledReason);
      return;
    }
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) {
      showError(t("toast.invalidCashOutAmount"));
      return;
    }
    if (parsed % 10 !== 0) {
      showError(t("toast.multipleOfTen"));
      return;
    }
    if (parsed > withdrawableBalance) {
      showError(t("toast.insufficientBalance"));
      return;
    }
    onSubmit({ amount: parsed, bankName, bankAccount });
  };

  return (
    <div className="lg:col-span-2 h-fit rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-xl">
      <h2 className="mb-6 flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
        <ArrowUpRight className="h-5 w-5 text-amber-400" />
        {t("cashOut.title")}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-md border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">
          {t("cashOut.available")}{" "}
          <span className="font-mono font-bold text-[var(--foreground)]">
            {formatNumber(withdrawableBalance)}
          </span>{" "}
          {t("cashOut.coinsUnit")}
        </div>

        {disabledReason && (
          <div className="rounded-md border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            {disabledReason}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm text-[var(--muted-foreground)]">
            {t("cashOut.amountLabel")}
          </label>
          <div className="relative">
            <Coins className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-foreground)]" />
            <input
              type="number"
              required
              min={10}
              placeholder={t("cashOut.amountPlaceholder")}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={Boolean(disabledReason)}
              className="w-full rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] py-3 pl-10 pr-4 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--muted-foreground)]">
            {t("cashOut.bankLabel")}
          </label>
          <select
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            disabled={Boolean(disabledReason)}
            className="w-full rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="Vietcombank" className="bg-[#1c0f2e] text-[#faf6ee]">
              Vietcombank
            </option>
            <option value="Techcombank" className="bg-[#1c0f2e] text-[#faf6ee]">
              Techcombank
            </option>
            <option value="MB Bank" className="bg-[#1c0f2e] text-[#faf6ee]">
              MB Bank
            </option>
            <option value="Momo Wallet" className="bg-[#1c0f2e] text-[#faf6ee]">
              Momo Wallet
            </option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--muted-foreground)]">
            {t("cashOut.accountLabel")}
          </label>
          <input
            type="text"
            required
            placeholder={t("cashOut.accountPlaceholder")}
            value={bankAccount}
            onChange={(e) => setBankAccount(e.target.value)}
            disabled={Boolean(disabledReason)}
            className="w-full rounded-md border border-[var(--border)] bg-[rgba(255,255,255,0.06)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--ring)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={Boolean(disabledReason)}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 py-3 font-black text-purple-950 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Loader2 className="hidden h-4 w-4 animate-spin" />
            {t("cashOut.submitBtn")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CashOutForm;
