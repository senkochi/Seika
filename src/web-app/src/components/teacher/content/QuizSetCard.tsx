import { DollarSign, Edit, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { QuizSetResponse } from "../../../api/types";
import type { Product } from "../../../api/services/marketplace";
import ProductStatusBadge from "./ProductStatusBadge";
import { useFormatDate } from "../../../utils/format";

interface QuizSetCardProps {
  set: QuizSetResponse;
  product?: Product;
  onEdit: (set: QuizSetResponse) => void;
  onDelete: (set: QuizSetResponse) => void;
}

function QuizSetCard({ set, product, onEdit, onDelete }: QuizSetCardProps) {
  const { t } = useTranslation("teacher");
  const formatDate = useFormatDate();
  return (
    <div className="bg-[var(--card)] backdrop-blur-xl border border-[var(--border)] rounded-2xl p-6 flex flex-col justify-between hover:border-[var(--primary)] transition-all group">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2.5 py-1 bg-blue-500/15 text-blue-300 text-xs font-medium rounded-md">
              {t("content.questionsCount", { count: set.quizzes?.length || 0 })}
            </span>
            <ProductStatusBadge
              status={product?.status}
              rejectionReason={product?.rejectionReason}
            />
          </div>
          <span className="flex items-center text-yellow-400 font-bold text-sm">
            <DollarSign className="w-4 h-4" />
            {set.price > 0
              ? t("content.priceCoins", { price: set.price })
              : t("content.free")}
          </span>
        </div>
        <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">
          {set.title}
        </h3>
        <p className="text-[var(--muted-foreground)] text-sm line-clamp-3 mb-6">
          {set.description || t("content.noDesc")}
        </p>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
        <span className="text-xs text-[var(--muted-foreground)]">
          {formatDate(set.createdAt)}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(set)}
            className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-all"
            title={t("content.editQuizSet")}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(set)}
            className="p-2 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title={t("content.deleteQuizSet")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizSetCard;
