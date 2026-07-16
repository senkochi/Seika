import {
  AlertTriangle,
  CheckCircle2,
  LockKeyhole,
  TimerReset,
} from "lucide-react";

import type { WalletHold } from "../../../api";

interface WalletControlPanelProps {
  frozen: boolean;
  holds: WalletHold[];
  loading: boolean;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Không thời hạn";
  return new Date(value).toLocaleString("vi-VN");
}

function holdLabel(type: string) {
  if (type === "WASH_HOLD") return "Rà soát wash trading";
  return type.replaceAll("_", " ");
}

export default function WalletControlPanel({
  frozen,
  holds,
  loading,
}: WalletControlPanelProps) {
  const hasBlockingState = frozen || holds.length > 0;

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-6 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold text-[var(--foreground)]">
            {hasBlockingState ? (
              <AlertTriangle
                className="h-5 w-5 text-amber-300"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                className="h-5 w-5 text-emerald-300"
                aria-hidden="true"
              />
            )}
            Trạng thái kiểm soát ví
          </h2>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Các hold hoặc freeze đang ảnh hưởng tới rút tiền và thao tác ví.
          </p>
        </div>
        <span
          className={
            hasBlockingState
              ? "rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-semibold text-amber-200"
              : "rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-xs font-semibold text-emerald-200"
          }
        >
          {hasBlockingState ? "Đang bị giới hạn" : "Bình thường"}
        </span>
      </div>

      {loading ? (
        <div
          className="mt-5 space-y-3"
          aria-busy="true"
          aria-label="Đang tải trạng thái kiểm soát ví"
        >
          <div className="h-16 animate-pulse rounded-md bg-white/[0.05]" />
          <div className="h-16 animate-pulse rounded-md bg-white/[0.05]" />
        </div>
      ) : !hasBlockingState ? (
        <div className="mt-5 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          Không có hold hoặc freeze đang hoạt động. Cash-out dùng số dư "Có thể
          rút".
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {frozen && (
            <div className="rounded-md border border-red-400/25 bg-red-400/10 p-4">
              <div className="flex items-center gap-2 font-semibold text-red-200">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Ví đang bị freeze
              </div>
              <p className="mt-1 text-sm text-red-100/80">
                Spend, top-up, cash-out, reward credit và escrow release credit
                sẽ bị chặn cho tới khi admin mở freeze.
              </p>
            </div>
          )}

          {holds.map((hold) => (
            <div
              key={hold.id}
              className="rounded-md border border-amber-400/25 bg-amber-400/10 p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-semibold text-amber-100">
                    <TimerReset className="h-4 w-4" aria-hidden="true" />
                    {holdLabel(hold.holdType)}
                  </div>
                  <p className="mt-1 text-sm text-amber-100/80">
                    {hold.reason || "Đang được rà soát bởi hệ thống quản trị."}
                  </p>
                </div>
                <div className="text-left text-xs text-amber-100/70 sm:text-right">
                  <div>Hết hạn</div>
                  <div className="font-mono text-amber-100">
                    {formatDate(hold.expiresAt)}
                  </div>
                </div>
              </div>
              {hold.sourceFlagId && (
                <p className="mt-2 font-mono text-xs text-amber-100/60">
                  Flag {hold.sourceFlagId}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
