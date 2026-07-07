import { Clock } from "lucide-react";
import type { TransactionResponse } from "../../../api/services/wallet";

interface TransactionListItemProps {
  tx: TransactionResponse;
}

function TransactionListItem({ tx }: TransactionListItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-[var(--second-card)] backdrop-blur-md rounded-xl hover:bg-[var(--second-muted)] transition-colors">
      <div className="text-2xl">
        <Clock className="w-6 h-6 text-blue-400" />
      </div>
      <div className="flex-1">
        <p className="text-[var(--foreground)] font-semibold text-sm">
          {tx.description}
        </p>
        <p className="text-[var(--muted-foreground)] text-xs">
          {new Date(tx.createdAt).toLocaleDateString()}
        </p>
      </div>
      <div className="flex items-center gap-1 px-3 py-1 bg-red-500/10 rounded-full">
        <span className="text-red-400 text-sm font-semibold">
          -{tx.amount} Coins
        </span>
      </div>
    </div>
  );
}

export default TransactionListItem;