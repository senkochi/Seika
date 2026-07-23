import { DollarSign, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { isPositiveTransaction, type Transaction } from "./types";
import { useFormatDate, useFormatNumber } from "../../../utils/format";

interface TransactionItemProps {
  tx: Transaction;
}

function TransactionItem({ tx }: TransactionItemProps) {
  const { t } = useTranslation("wallet");
  const formatDate = useFormatDate();
  const formatNumber = useFormatNumber();
  const positive = isPositiveTransaction(tx);
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--second-card)] border border-[var(--border)] rounded-xl hover:bg-[var(--second-muted)] transition-colors">
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          {tx.description}
        </p>
        <p className="text-xs text-[var(--muted-foreground)] mt-1">
          {formatDate(tx.createdAt)}
        </p>
      </div>
      <div
        className={`text-right font-bold text-base shrink-0 ml-4 ${
          positive ? "text-green-400" : "text-red-400"
        }`}
      >
        {positive ? "+" : "-"}
        {formatNumber(Math.abs(tx.amount))} {t("history.coinsUnit")}
      </div>
    </div>
  );
}

interface TransactionHistoryProps {
  history: Transaction[];
  loading: boolean;
}

function TransactionHistory({ history, loading }: TransactionHistoryProps) {
  const { t } = useTranslation("wallet");
  return (
    <div className="lg:col-span-3 bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-3xl p-6">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-6 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-amber-400" />
        {t("history.title")}
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--muted-foreground)] gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-sm">{t("history.loading")}</p>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-20 text-[var(--muted-foreground)]">
          {t("history.emptyTeacher")}
        </div>
      ) : (
        <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-2">
          {history.map((tx) => (
            <TransactionItem key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TransactionHistory;
