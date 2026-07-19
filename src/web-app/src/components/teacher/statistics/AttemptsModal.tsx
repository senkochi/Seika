import { CheckCircle2, X, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { QuizAttempt } from "../../../api/types";
import StatisticsLoadingState from "./StatisticsLoadingState";
import { useFormatDate } from "../../../utils/format";

interface AttemptsModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  attempts: QuizAttempt[] | undefined;
  isLoading: boolean;
}

function AttemptsModal({
  open,
  onClose,
  productName,
  attempts,
  isLoading,
}: AttemptsModalProps) {
  const { t } = useTranslation("teacher");
  const formatDate = useFormatDate();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {t("statistics.attemptsTitle")}
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {productName}
            </p>
          </div>
          <button
            aria-label={t("statistics.close")}
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <StatisticsLoadingState message={t("statistics.loadingAttempts")} />
          ) : !attempts || attempts.length === 0 ? (
            <p className="py-12 text-center text-[var(--muted-foreground)]">
              {t("statistics.attemptsEmpty")}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)]">
                  <th className="pb-3 font-medium">
                    {t("statistics.colStudent")}
                  </th>
                  <th className="pb-3 font-medium">
                    {t("statistics.colScore")}
                  </th>
                  <th className="pb-3 font-medium">
                    {t("statistics.colStatus")}
                  </th>
                  <th className="pb-3 font-medium">
                    {t("statistics.colDate")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="py-3 font-mono text-xs text-[var(--foreground)]">
                      {attempt.userId.length > 14
                        ? `${attempt.userId.slice(0, 8)}…${attempt.userId.slice(-4)}`
                        : attempt.userId}
                    </td>
                    <td className="py-3 text-[var(--foreground)]">
                      {attempt.score.toFixed(1)}%
                    </td>
                    <td className="py-3">
                      {attempt.passed ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                          {t("statistics.passed")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/15 px-2.5 py-1 text-xs font-medium text-rose-300">
                          <XCircle className="h-3.5 w-3.5" />{" "}
                          {t("statistics.failed")}
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[var(--muted-foreground)]">
                      {formatDate(attempt.attemptAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AttemptsModal;
