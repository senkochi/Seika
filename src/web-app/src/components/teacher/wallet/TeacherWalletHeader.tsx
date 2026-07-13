import { RefreshCcw, ShieldCheck, WalletCards } from "lucide-react";

import { formatVnd } from "./types";

interface TeacherWalletHeaderProps {
  balance: number;
  withdrawableBalance: number;
  appOnlyBalance: number;
  loading: boolean;
  onReload: () => void;
}

function TeacherWalletHeader({
  balance,
  withdrawableBalance,
  appOnlyBalance,
  loading,
  onReload,
}: TeacherWalletHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-black text-[var(--foreground)]">
            <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Teacher Wallet
            </span>
            <button
              type="button"
              onClick={onReload}
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-all hover:border-[var(--primary)]"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Track withdrawable earnings, app-only coins, and escrow flow.
          </p>
        </div>

        <div className="grid w-full gap-3 md:grid-cols-3 lg:max-w-3xl">
          <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-xs font-bold uppercase">Co the rut</p>
            </div>
            <p className="mt-3 font-mono text-2xl font-black text-[var(--foreground)]">
              {loading ? "..." : formatVnd(withdrawableBalance)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              EARNED_WITHDRAWABLE
            </p>
          </div>

          <div className="rounded-lg border border-amber-400/20 bg-amber-400/10 p-4">
            <div className="flex items-center gap-2 text-amber-300">
              <WalletCards className="h-5 w-5" />
              <p className="text-xs font-bold uppercase">Chi dung trong app</p>
            </div>
            <p className="mt-3 font-mono text-2xl font-black text-[var(--foreground)]">
              {loading ? "..." : formatVnd(appOnlyBalance)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              BONUS / REWARD / PAID / PROMO
            </p>
          </div>

          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
            <p className="text-xs font-bold uppercase text-[var(--muted-foreground)]">
              Total wallet
            </p>
            <p className="mt-3 font-mono text-2xl font-black text-[var(--foreground)]">
              {loading ? "..." : formatVnd(balance)}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Secondary total
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeacherWalletHeader;
