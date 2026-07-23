import { ArrowRight, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { TransactionResponse } from "../../../api/services/wallet";
import { SectionCard } from "../../ui/SectionCard";
import { EmptyState } from "../../ui/EmptyState";
import { StatusPill } from "../../ui/StatusPill";
import { useFormatDate, useFormatNumber } from "../../../utils/format";

interface RecentIncomesListProps {
  events: TransactionResponse[];
  onGoToWallet: () => void;
}

function RecentIncomesList({ events, onGoToWallet }: RecentIncomesListProps) {
  const { t } = useTranslation("teacher");
  const formatDate = useFormatDate();
  const formatNumber = useFormatNumber();
  return (
    <SectionCard>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-sans-ui text-base font-semibold text-cream">
          {t("recentIncomes.title")}
        </h2>
        <button
          type="button"
          onClick={onGoToWallet}
          className="font-sans-ui text-xs text-[#d4a843] hover:underline transition-colors flex items-center gap-1"
        >
          {t("recentIncomes.openWallet")}
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>

      {events.length === 0 ? (
        <EmptyState
          icon={<Clock className="w-5 h-5" aria-hidden="true" />}
          title={t("recentIncomes.emptyTitle")}
          description={t("recentIncomes.emptyDesc")}
        />
      ) : (
        <div className="space-y-3 font-sans-ui">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-10 h-10 bg-white/[0.04] border border-white/[0.06] rounded-lg flex items-center justify-center">
                <Clock
                  className="w-4 h-4 text-emerald-300"
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-cream font-medium text-sm truncate">
                  {event.description}
                </p>
                <p className="text-white/45 text-xs mt-0.5">
                  {formatDate(event.createdAt)}
                </p>
              </div>
              <StatusPill variant="success">
                {t("recentIncomes.coinsPlus", {
                  amount: formatNumber(event.amount),
                })}
              </StatusPill>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

export default RecentIncomesList;
