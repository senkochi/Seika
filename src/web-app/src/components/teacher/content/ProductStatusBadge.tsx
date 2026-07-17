import { useTranslation } from "react-i18next";

interface ProductStatusBadgeProps {
  status: string | undefined;
  rejectionReason?: string | null;
}

const STYLES: Record<string, { bg: string; text: string; border: string }> = {
  PUBLISHED: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
  },
  REJECTED: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
  },
  HIDDEN: {
    bg: "bg-slate-500/10",
    text: "text-slate-400",
    border: "border-slate-500/20",
  },
  PENDING_REVIEW: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/20",
  },
};

export const DEFAULT_STATUS_STYLE = {
  bg: "bg-amber-500/10",
  text: "text-amber-400",
  border: "border-amber-500/20",
};

function ProductStatusBadge({
  status,
  rejectionReason,
}: ProductStatusBadgeProps) {
  const { t } = useTranslation("teacher");
  const s = STYLES[status ?? ""] ?? DEFAULT_STATUS_STYLE;
  const isRejected = status === "REJECTED";

  const getLabel = (st: string | undefined) => {
    switch (st) {
      case "PUBLISHED":
        return t("content.statusPublished");
      case "REJECTED":
        return t("content.statusRejected");
      case "HIDDEN":
        return t("content.statusHidden");
      case "PENDING_REVIEW":
      default:
        return t("content.statusPending");
    }
  };

  return (
    <span
      className={`px-3 py-1 ${s.bg} ${s.text} text-xs font-semibold rounded-full border ${s.border} ${
        isRejected ? "cursor-help relative group/tooltip" : ""
      }`}
      title={
        isRejected
          ? rejectionReason
            ? `${t("content.rejectionReasonPrefix")}: ${rejectionReason}`
            : t("content.statusRejected")
          : undefined
      }
    >
      {getLabel(status)}
      {isRejected && rejectionReason && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 hidden group-hover/tooltip:block bg-slate-900 border border-red-500/30 text-red-200 text-xs rounded-lg p-2.5 shadow-xl z-20 whitespace-normal text-center">
          {rejectionReason}
        </span>
      )}
    </span>
  );
}

export default ProductStatusBadge;
export { STYLES };
