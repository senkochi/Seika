import { CheckCircle2, X, XCircle } from "lucide-react";
import { format } from "date-fns";

import type { QuizAttempt } from "../../../api/types";
import StatisticsLoadingState from "./StatisticsLoadingState";

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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] p-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Lịch sử làm bài
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">
              {productName}
            </p>
          </div>
          <button
            aria-label="Đóng"
            onClick={onClose}
            className="rounded-lg p-2 text-[var(--muted-foreground)] hover:bg-[var(--background)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {isLoading ? (
            <StatisticsLoadingState message="Đang tải lịch sử làm bài..." />
          ) : !attempts || attempts.length === 0 ? (
            <p className="py-12 text-center text-[var(--muted-foreground)]">
              Chưa có lượt làm bài nào.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--muted-foreground)]">
                  <th className="pb-3 font-medium">Học sinh</th>
                  <th className="pb-3 font-medium">Điểm</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium">Ngày</th>
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Đạt
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-1 text-xs font-medium text-rose-400">
                          <XCircle className="h-3.5 w-3.5" /> Chưa đạt
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[var(--muted-foreground)]">
                      {format(new Date(attempt.attemptAt), "dd/MM/yyyy HH:mm")}
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