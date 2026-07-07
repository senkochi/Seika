import { ArrowRight } from "lucide-react";
import type { TransactionResponse } from "../../../api/services/wallet";
import TransactionListItem from "./TransactionListItem";

interface RecentTransactionsSectionProps {
  transactions: TransactionResponse[];
}

function RecentTransactionsSection({
  transactions,
}: RecentTransactionsSectionProps) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] hover:border-[var(--primary)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          Recent Transactions
        </h2>
        <button className="text-sm text-[var(--muted-foreground)] hover:text-[var(--light-primary)] transition-colors flex items-center gap-1">
          See All
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-[var(--muted-foreground)] text-sm">
            No recent transactions.
          </p>
        ) : (
          transactions.map((tx) => <TransactionListItem key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}

export default RecentTransactionsSection;