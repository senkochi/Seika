import { Clock } from "lucide-react";
import type { TransactionResponse } from "../../../api/services/wallet";
import { IconChip } from "../../ui/IconChip";

interface TransactionListItemProps {
  tx: TransactionResponse;
}

function TransactionListItem({ tx }: TransactionListItemProps) {
  const isNegative = tx.amount < 0;
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
      <IconChip variant={isNegative ? "danger" : "success"}>
        <Clock className="w-4 h-4" aria-hidden="true" />
      </IconChip>
      <div className="flex-1 min-w-0">
        <p className="font-sans-ui text-sm font-medium text-cream truncate">
          {tx.description}
        </p>
        <p className="font-sans-ui text-xs text-white/55">
          {new Date(tx.createdAt).toLocaleDateString("vi-VN")}
        </p>
      </div>
      <div
        className={
          isNegative
            ? "font-sans-ui text-sm font-semibold text-red-300 tabular-nums"
            : "font-sans-ui text-sm font-semibold text-emerald-300 tabular-nums"
        }
      >
        {isNegative ? "-" : "+"}
        {Math.abs(tx.amount).toLocaleString("vi-VN")} coin
      </div>
    </div>
  );
}

export default TransactionListItem;