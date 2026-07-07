import { ArrowRight, Clock } from "lucide-react";
import type { TransactionResponse } from "../../../api/services/wallet";

interface RecentIncomesListProps {
  events: TransactionResponse[];
  onGoToWallet: () => void;
}

function RecentIncomesList({ events, onGoToWallet }: RecentIncomesListProps) {
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] shadow-[0_20px_60px_rgba(10,10,20,0.28)] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-[var(--foreground)]">
          Recent Incomes
        </h2>
        <button
          onClick={onGoToWallet}
          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--light-primary)] transition-colors flex items-center gap-1"
        >
          Go to Wallet
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-[var(--muted-foreground)] text-sm">
            No recent incomes.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-4 bg-[var(--second-card)] backdrop-blur-md rounded-xl hover:bg-[var(--second-muted)] transition-colors"
            >
              <div className="text-2xl w-10 h-10 bg-[var(--card)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-[var(--foreground)] font-semibold text-sm">
                  {event.description}
                </p>
                <p className="text-[var(--muted-foreground)] text-xs">
                  {new Date(event.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-400">
                +{event.amount} Coins
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default RecentIncomesList;