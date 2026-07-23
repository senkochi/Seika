import { useTranslation } from "react-i18next";

interface ProductStatusBadgeProps {
  status: string | undefined;
  rejectionReason?: string | null;
}

const STYLES: Record<string, { bg: string; text: string; border: string }> = {
  PUBLISHED: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-300",
    border: "",
  },
  REJECTED: {
    bg: "bg-rose-500/15",
    text: "text-rose-300",
    border: "",
  },
  HIDDEN: {
    bg: "bg-slate-500/15",
    text: "text-slate-300",
    border: "",
  },
  PENDING_REVIEW: {
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    border: "",
  },
};

export const DEFAULT_STATUS_STYLE = {
  bg: "bg-amber-500/15",
  text: "text-amber-300",
  border: "",
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
      className={`px-2.5 py-1 ${s.bg} ${s.text} text-xs font-medium rounded-md ${
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
