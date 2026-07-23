import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Loader2,
  UserRound,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import type { PendingProduct } from "../../../api/types";
import { showError } from "../../toast/toastUtils";
import { Button } from "../../ui/Button";
import { StatusPill } from "../../ui/StatusPill";
import { useFormatDate, useFormatNumber } from "../../../utils/format";
import { recognizableUsername } from "../../../utils/displayName";

interface ProductDetailDrawerProps {
  product: PendingProduct | null;
  isMutating: boolean;
  onClose: () => void;
  onPreview: (product: PendingProduct) => void;
  onApprove: (product: PendingProduct) => Promise<boolean>;
  onReject: (product: PendingProduct) => void;
}

type CopyField = "sellerUserId" | "referenceId";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 border-b border-white/[0.06] py-4 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="font-sans-ui text-xs uppercase tracking-[0.12em] text-white/45">
        {label}
      </dt>
      <dd className="min-w-0 font-sans-ui text-sm text-cream">{children}</dd>
    </div>
  );
}

export function ProductDetailDrawer({
  product,
  isMutating,
  onClose,
  onPreview,
  onApprove,
  onReject,
}: ProductDetailDrawerProps) {
  const { t } = useTranslation("admin");
  const formatDate = useFormatDate();
  const formatNumber = useFormatNumber();
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);

  const copyValue = async (field: CopyField, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1600);
    } catch {
      showError(t("moderation.detail.copyFailed"));
    }
  };

  const closeDrawer = () => {
    if (!isMutating) {
      setCopiedField(null);
      onClose();
    }
  };

  return (
    <Dialog.Root
      open={product !== null}
      onOpenChange={(open) => {
        if (!open) closeDrawer();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-30 bg-black/65 backdrop-blur-sm" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col border-l border-white/[0.08] bg-[var(--card)] text-cream outline-none">
          {product && (
            <>
              <header className="flex items-start justify-between gap-5 border-b border-white/[0.06] px-5 py-5 sm:px-7">
                <div className="min-w-0">
                  <Dialog.Title className="font-display text-2xl font-semibold text-cream">
                    {product.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 font-sans-ui text-sm text-white/55">
                    {t("moderation.detail.subtitle")}
                  </Dialog.Description>
                </div>
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label={t("moderation.detail.close")}
                    disabled={isMutating}
                    className="rounded-lg p-2 text-white/45 transition-colors hover:bg-white/[0.06] hover:text-cream disabled:opacity-50"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </Dialog.Close>
              </header>

              <div className="flex-1 overflow-y-auto px-5 py-2 sm:px-7">
                <dl>
                  <DetailRow label={t("moderation.detail.description")}>
                    <p className="whitespace-pre-wrap leading-6 text-white/75">
                      {product.description ||
                        t("moderation.detail.noDescription")}
                    </p>
                  </DetailRow>
                  <DetailRow label={t("moderation.detail.username")}>
                    <span className="inline-flex items-center gap-2">
                      <UserRound
                        className="h-4 w-4 text-[#d4a843]"
                        aria-hidden="true"
                      />
                      {recognizableUsername(product.teacherDisplayName) || "—"}
                    </span>
                  </DetailRow>
                  <DetailRow label={t("moderation.detail.userId")}>
                    <CopyableValue
                      value={product.sellerUserId}
                      copied={copiedField === "sellerUserId"}
                      copyLabel={t("moderation.detail.copyUserId")}
                      onCopy={() =>
                        void copyValue("sellerUserId", product.sellerUserId)
                      }
                    />
                  </DetailRow>
                  <DetailRow label={t("moderation.detail.referenceId")}>
                    <CopyableValue
                      value={product.referenceId}
                      copied={copiedField === "referenceId"}
                      copyLabel={t("moderation.detail.copyReferenceId")}
                      onCopy={() =>
                        void copyValue("referenceId", product.referenceId)
                      }
                    />
                  </DetailRow>
                  <DetailRow label={t("moderation.detail.type")}>
                    {product.type}
                  </DetailRow>
                  <DetailRow label={t("moderation.detail.price")}>
                    <span className="tabular-nums">
                      {formatNumber(product.price)} coin
                    </span>
                  </DetailRow>
                  <DetailRow label={t("moderation.detail.createdAt")}>
                    {formatDate(product.createdAt)}
                  </DetailRow>
                  <DetailRow label={t("moderation.detail.status")}>
                    <StatusPill variant="warning">{product.status}</StatusPill>
                  </DetailRow>
                  {product.rejectionReason && (
                    <DetailRow label={t("moderation.detail.rejectionReason")}>
                      <p className="whitespace-pre-wrap text-amber-200">
                        {product.rejectionReason}
                      </p>
                    </DetailRow>
                  )}
                </dl>
              </div>

              <footer className="flex flex-wrap justify-end gap-2 border-t border-white/[0.06] px-5 py-4 sm:px-7">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => onPreview(product)}
                  disabled={isMutating}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  {t("moderation.preview")}
                </Button>
                <Button
                  variant="ghost"
                  tone="danger"
                  size="md"
                  onClick={() => onReject(product)}
                  disabled={isMutating}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {t("moderation.reject")}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => void onApprove(product)}
                  disabled={isMutating}
                >
                  {isMutating ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Check className="h-4 w-4" aria-hidden="true" />
                  )}
                  {t("moderation.approve")}
                </Button>
              </footer>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CopyableValue({
  value,
  copied,
  copyLabel,
  onCopy,
}: {
  value: string;
  copied: boolean;
  copyLabel: string;
  onCopy: () => void;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <code className="min-w-0 flex-1 break-all font-mono text-xs text-white/65">
        {value}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label={copyLabel}
        className="flex-shrink-0 rounded-lg p-2 text-white/45 transition-colors hover:bg-white/[0.06] hover:text-cream"
      >
        {copied ? (
          <CheckCircle2
            className="h-4 w-4 text-emerald-300"
            aria-hidden="true"
          />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </span>
  );
}
