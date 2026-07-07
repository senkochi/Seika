import { RefreshCcw } from "lucide-react";

import { formatVnd } from "./types";

interface TeacherWalletHeaderProps {
  balance: number;
  loading: boolean;
  onReload: () => void;
}

function TeacherWalletHeader({
  balance,
  loading,
  onReload,
}: TeacherWalletHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
        <div>
          <h1 className="text-3xl font-black text-[var(--foreground)] mb-2 flex items-center gap-3">
            <span className="bg-gradient-to-r from-amber-300 to-yellow-400 bg-clip-text text-transparent">
              Teacher Wallet
            </span>
            <button
              onClick={onReload}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm font-medium text-[var(--foreground)] hover:border-[var(--primary)] transition-all"
            >
              <RefreshCcw className="h-4 w-4" /> Làm mới
            </button>
          </h1>
          <p className="text-[var(--muted-foreground)]">
            Manage your earnings, check balances and spent coins.
          </p>
        </div>

        <div className="relative group w-full md:w-[30rem] lg:w-[34rem] md:ml-auto">
          <div className="relative w-full bg-gradient-to-b from-amber-400 to-yellow-500 rounded-3xl p-1 shadow-2xl">
            <div className="rounded-[22px] px-8 py-6">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-white text-sm font-black uppercase tracking-wider mb-1">
                    Your Balance
                  </p>
                  <p className="text-purple-950 text-4xl font-black">
                    {loading ? "..." : formatVnd(balance)}
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
  );
}

export default TeacherWalletHeader;