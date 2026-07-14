import { ArrowRight } from "lucide-react";
import type { TransactionResponse } from "../../../api/services/wallet";
import { SectionCard } from "../../ui/SectionCard";
import { EmptyState } from "../../ui/EmptyState";
import TransactionListItem from "./TransactionListItem";

interface RecentTransactionsSectionProps {
  transactions: TransactionResponse[];
}

function RecentTransactionsSection({
  transactions,
}: RecentTransactionsSectionProps) {
  return (
    <SectionCard
      header={
        <>
          <h2 className="font-sans-ui text-base font-semibold text-cream">
            Giao dịch gần đây
          </h2>
          <button className="font-sans-ui text-xs text-white/55 hover:text-cream transition-colors flex items-center gap-1">
            Xem tất cả
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </>
      }
    >
      {transactions.length === 0 ? (
        <EmptyState
          icon={<ArrowRight className="w-5 h-5" aria-hidden="true" />}
          title="Chưa có giao dịch nào"
          description="Hoạt động mua bán hoặc nạp/rút coin sẽ hiện ở đây."
        />
      ) : (
        <div className="space-y-2">
          {transactions.map((tx) => (
            <TransactionListItem key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default RecentTransactionsSection;